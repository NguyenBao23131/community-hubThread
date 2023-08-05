
import React from 'react';
import { currentUser } from "@clerk/nextjs";

const RightSidebar = async () => {
    return (
        <>
            <section
                className='custom-scrollbar rightsidebar
                border-l-2 border-gray-700'
            >
                <div className='flex flex-1 flex-col justify-start'>
                    <h3 className='text-heading4-medium text-light-1'>
                        Suggested Communities
                    </h3>
                </div>
            </section>
        </>
    );
};

export default RightSidebar;
