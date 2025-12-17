
import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api-utils';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Public or Auth? Requirement says "backend-driven flags to control account UI"
    // Usually public or semi-private. Let's make it public for now or check auth if strictly account features.
    // But since it controls UI structure often needed before login or for generic UI, public is easier.

    // Fetch settings from DB
    const settings = await query("SELECT category, value FROM settings WHERE category = 'account_features' OR category = 'general'");

    // Transform to simple object
    const features: Record<string, boolean> = {
      enable_reviews: true, // default
      request_data_deletion: true,
      marketing_preferences: true
    };

    // Logic to override from DB if we had a settings table structured for this
    // For now, return the defaults as per my plan to support UI control

    return successResponse(features);
  } catch (error) {
    return handleApiError(error);
  }
}
