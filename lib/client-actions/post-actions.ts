"use client"

// This is a temporary file to fix the deployment error
// It redirects to the message-actions functions

import { createMessage, updateMessage, deleteMessage, getMessageById, getAllMessages } from "./message-actions"

// Export the createMessage function as createPost for backward compatibility
export const createPost = createMessage

// Export other functions for backward compatibility
export const updatePost = updateMessage
export const deletePost = deleteMessage
export const getPostById = getMessageById
export const getAllPosts = getAllMessages

