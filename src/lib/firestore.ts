
// Shim to replace Firebase Firestore with MySQL/Stubs
import { getProducts as getProductsMySQL, getProduct as getProductMySQL, createProduct as createProductMySQL, updateProduct as updateProductMySQL, updateVariantOnProduct as updateVariantOnProductMySQL, deleteProduct as deleteProductMySQL } from './products';
import { getCollections as getCollectionsMySQL, getCollectionBySlug as getCollectionBySlugMySQL, createCollection as createCollectionMySQL, updateCollection as updateCollectionMySQL, deleteCollection as deleteCollectionMySQL, getSubcategories as getSubcategoriesMySQL, getAllSubcategories as getAllSubcategoriesMySQL, getActiveCollections as getActiveCollectionsMySQL } from './collections';
import { getAttributeGroups as getAttributeGroupsMySQL } from './attributes';

// Mock Timestamp
import { Timestamp } from './date-utils';
export { Timestamp };


// Products
export const getProducts = getProductsMySQL;
export const getProduct = getProductMySQL;
export const createProduct = createProductMySQL;
export const updateProduct = updateProductMySQL;
export const updateVariantOnProduct = updateVariantOnProductMySQL;
export const deleteProduct = deleteProductMySQL;

// Collections/Categories
export const getCategories = getCollectionsMySQL;
export const getActiveCategories = getActiveCollectionsMySQL; // Alias for now
export const getCategoryBySlug = getCollectionBySlugMySQL;
export const createCategory = createCollectionMySQL;
export const updateCategory = updateCollectionMySQL;
export const deleteCategory = deleteCollectionMySQL;

export const getSubcategories = getSubcategoriesMySQL;
export const getActiveSubcategories = getAllSubcategoriesMySQL;

// Attributes
export const getAttributeGroups = getAttributeGroupsMySQL;

// Stubs for other features (Orders, Customers, etc.)
// These prevent the build from failing but don't persist data yet.

export async function createOrder(data: any): Promise<any> { console.warn('createOrder not implemented'); return 'mock-order-id'; }
export async function getOrders(): Promise<any[]> { return []; }
export async function getOrder(id: string): Promise<any> { return null; }
export async function updateOrderStatus(id?: string, status?: string) { console.warn('updateOrderStatus stub called'); }
export async function deleteOrder(id?: string) { console.warn('deleteOrder stub called'); }

export async function getCustomers(): Promise<any[]> { return []; }
export async function getCustomer(id: string): Promise<any> { return null; }

// Media
import { getAllImages as getAllImagesMySQL, updateImage as updateImageMySQL, deleteImage as deleteImageMySQL, createImage as createImageMySQL } from './media';

export const getAllImages = getAllImagesMySQL;
export const updateImage = updateImageMySQL;
export const deleteImage = deleteImageMySQL;
export const createImage = createImageMySQL;

export async function createMedia(data: any) { return 'mock-media-id'; }
export async function getMedia() { return getAllImagesMySQL(); } // Alias
export async function deleteMediaItem() { } // Legacy stub


export async function createReview(data: any) { return 'mock-review-id'; }
export async function getProductReviews(productId: string, approvedOnly?: boolean) { return []; }
export async function getAllReviews(approvedOnly?: boolean) { return []; }
export async function updateReview(id: string, data: any) { }
export async function deleteReview(id: string) { }

// Promotions
import { getPromotions as getPromotionsMySQL, getPromotionByCode as getPromotionByCodeMySQL, createPromotion as createPromotionMySQL, updatePromotion as updatePromotionMySQL, deletePromotion as deletePromotionMySQL } from './promotions';

export const getPromotions = getPromotionsMySQL;
export const getPromotionByCode = getPromotionByCodeMySQL;
export const createPromotion = createPromotionMySQL;
export const updatePromotion = updatePromotionMySQL;
export const deletePromotion = deletePromotionMySQL;

// Utils
export function serverTimestamp() { return Timestamp.now(); }
