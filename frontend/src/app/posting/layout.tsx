"use client";

import React from 'react';
import '../admin/admin.css';
import './posting.css';

export default function PostingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {children}
        </>
    );
}
