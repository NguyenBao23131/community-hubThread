
import React, { Fragment, Suspense } from 'react';
import { currentUser } from "@clerk/nextjs";
import UserCard from '../cards/UserCard';

import { fetchUsers } from '@/lib/actions/user.actions';

const RightSidebar = async () => {

    const user = await currentUser();

    if(!user) return null;

    const similarMinds = await fetchUsers({
        userId: user.id,
        pageSize: 4,
    });

    return (
        <>
            <section
                className='custom-scrollbar rightsidebar
                border-l-[1px] border-gray-700'
            >
                <div className='flex flex-1 flex-col justify-start'>
                    <h3 className='text-heading4-medium text-light-1'>
                        Suggested Communities
                    </h3>

                    <div className='mt-7 flex-w-[350px] flex-col gap-9'>
                        {similarMinds.users.length > 0 ? (
                            <>
                                {similarMinds.users.map((person) => (
                                    <>
                                        <Fragment key={person.id}>
                                            <Suspense>
                                                <UserCard
                                                    id={person.id}
                                                    name={person.name}
                                                    username={person.username}
                                                    imgUrl={person.image}
                                                    personType='User'
                                                />
                                            </Suspense>
                                        </Fragment>
                                    </>
                                ))}
                            </>
                        ): (
                            <>
                                <p className='!text-base-regular text-light-3'>
                                    No users yet
                                </p>
                            </>
                        )}
                    </div>

                </div>

                <div className='flex flex-1 flex-col justify-start'>
                    <h3 className='text-heading4-medium text-light-1'>
                        Similar Minds
                    </h3>

                    <div className='mt-7 flex-w-[350px] flex-col gap-10'>
                        {similarMinds.users.length > 0 ? (
                            <>
                                {similarMinds.users.map((person) => (
                                    <>
                                        <Fragment key={person.id}>
                                            <Suspense>
                                                <UserCard
                                                    id={person.id}
                                                    name={person.name}
                                                    username={person.username}
                                                    imgUrl={person.image}
                                                    personType='User'
                                                />
                                            </Suspense>
                                        </Fragment>
                                    </>
                                ))}
                            </>
                        ): (
                            <>
                                <p className='!text-base-regular text-light-3'>
                                    No users yet
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
};

export default RightSidebar;
