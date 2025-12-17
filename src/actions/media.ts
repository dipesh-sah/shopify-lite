"use server"

import { getAllImages, updateImage, deleteImage, createImage } from "@/lib/media"

export async function getImagesAction() {
  try {
    const images = await getAllImages(100, 0); // Limit 100 for now
    return images;
  } catch (error) {
    console.error("Error getting images:", error);
    return [];
  }
}

export async function updateImageAction(id: string, altText: string) {
  try {
    await updateImage(id, { altText });
    return { success: true };
  } catch (error) {
    console.error("Error updating image:", error);
    return { error: "Failed to update image" };
  }
}

export async function createImageAction(url: string, altText?: string) {
  try {
    const id = await createImage(url, altText);
    return { success: true, id };
  } catch (error) {
    console.error("Error creating image:", error);
    return { error: "Failed to create image" };
  }
}

export async function deleteImageAction(id: string) {
  try {
    await deleteImage(id);
    return { success: true };
  } catch (error) {
    console.error("Error deleting image:", error);
    return { error: "Failed to delete image" };
  }
}
