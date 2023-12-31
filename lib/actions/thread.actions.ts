"use server";

import { revalidatePath } from "next/cache";

import { connectToDB } from "../mongoose";
import { User, Thread, Community } from "../models";

interface Params {
    text: string;
    author: string;
    communityId: string | null;
    path: string;
};

// ToHandleFunc

export const createThread = async({ text, author, communityId, path }: Params) => {
    try {
        connectToDB();

        const communityIdObject = await Community.findOne(
            {
                id: communityId,
            },
            {
                _id: 1,
            },
        );

        const createThread = await Thread.create({
            text,
            author,
            community: communityIdObject,
        });

        await User.findByIdAndUpdate(author, {
            $push: {
                threads: createThread._id,
            },
        });

        if(communityIdObject) {
            await Community.findByIdAndUpdate(communityIdObject, {
                $push: {
                    threads: createThread._id,
                },
            });
        }

        revalidatePath(path);

    } catch (error: any) {
        throw new Error(`Failed to create thread: ${error.message}`);
    }
};

export const fetchThreadById = async(threadId: string) => {
    try {
        connectToDB();

        const thread = await Thread.findById(threadId)
            .populate({
                path: "author",
                model: User,
                select: "_id id name image",
            })
            .populate({
                path: "community",
                model: Community,
                select: "_id id name image",
            })
            .populate({
                path: "children",
                populate: [
                    {
                        path: "author", // Populate the author field within children
                        model: User,
                        select: "_id id name parentId image", // Select only _id and username fields of the author
                    },
                    {
                        path: "children", // Populate the children field within children
                        model: Thread, // The model of the nested children (assuming it's the same "Thread" model)
                        populate: {
                            path: "author", // Populate the author field within nested children
                            model: User,
                            select: "_id id name parentId image", // Select only _id and username fields of the author
                        },
                    },
                ],
            })
            .exec();

        return thread;
    } catch (error: any) {
        console.error("Error while fetching thread", error);
        throw new Error("Unable to fetch thread");
    }
};

export const fetchPosts = async(pageNumber = 1, pageSize = 20) => {
    try {

        connectToDB();

        const skipAmount = (pageNumber - 1) * pageSize;

        const postQuery = Thread.find({
            parentId: {
                $in: [null, undefined],
            },
        })
            .sort({ createdAt: "desc" })
            .skip(skipAmount)
            .limit(pageSize)
            .populate({
                path: "author",
                model: User,
            })
            .populate({
                path: "community",
                model: Community,
            })
            .populate({
                path: "children",
                populate: {
                    path: "author",
                    model: User,
                    select: "_id name parentId image",
                },
            });

            const totalPostCount = await Thread.countDocuments({
                parentId: { $in: [null, undefined], },
            });

            const posts = await postQuery.exec();

            const isNext = totalPostCount > skipAmount + posts.length;

            return {
                posts,
                isNext,
            };
    } catch (error: any) {
        console.error('Error to fetchPosts: ', error);
        throw error;
    }
};

export const fetchAllChildThreads = async(threadId: string): Promise<any[]> => {
    const childThreads = await Thread.find({ parentId: threadId });

    const descendantThreads = [];
    for (const childThread of childThreads) {
        const descendants = await fetchAllChildThreads(childThread._id);
        descendantThreads.push(childThread, ...descendants);
    }

    return descendantThreads;
};

export const deleteThread = async(id: string, path: string): Promise<void> => {
    try {
        connectToDB();

        const mainThread = await Thread.findById(id).populate("author community");

        if(!mainThread) {
            throw new Error("Thread not found");
        }

        const descendantThreads = await fetchAllChildThreads(id);

        const descendantThreadIds = [
            id,
            ...descendantThreads.map((thread) => thread.id),
        ];

        const uniqueAuthorIds = new Set(
            [
                ...descendantThreads.map((thread) => thread.author?._id?.toString()),
                mainThread.author?._id?.toString(),
            ].filter((id) => id !== undefined),
        );

        const uniqueCommunityIds = new Set(
            [
                ...descendantThreads.map((thread) => thread.author?._id?.toString()),
                mainThread.author?._id?.toString(),
            ].filter((id) => id !== undefined),
        );

        await Thread.deleteMany({
            _id: { $in: descendantThreadIds }
        });

        await User.updateMany(
            { _id: { $in: Array.from(uniqueAuthorIds) } },
            { $pull: { threads: { $in: descendantThreadIds } } }
        );

          // Update Community model
        await Community.updateMany(
            { _id: { $in: Array.from(uniqueCommunityIds) } },
            { $pull: { threads: { $in: descendantThreadIds } } }
        );

        revalidatePath(path);
    } catch (error: any) {
        console.error("Error to delete Threads", error);
        throw error;
    }
};

export const addCommentToThread = async(
    threadId: string,
    commentText: string,
    userId: string,
    path: string,
) => {

    try {
        connectToDB();

        const originalThread = await Thread.findById(threadId);

        if(!originalThread) {
            throw new Error("Thread not found");
        }

        const commentThread = new Thread({
            text: commentText,
            author: userId,
            parentId: threadId,
        });

        const saveCommentThread = await commentThread.save();

        originalThread.children.push(saveCommentThread._id);

        await originalThread.save();

        revalidatePath(path);
    } catch (error: any) {
        console.error("Error while adding comment: ", error);
        throw new Error("Unable to add comment");
    }
};
