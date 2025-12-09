// Stubs for email campaigns to replace Firebase
export type CampaignStatus = 'draft' | 'scheduled' | 'sent' | 'cancelled';
export type CampaignType = 'promotional' | 'newsletter' | 'abandoned-cart' | 'transactional';

export async function createEmailCampaign(data: any) {
  return 'mock-campaign-id';
}

export async function getEmailCampaigns() {
  return [];
}

export async function getEmailCampaign(id: string) {
  return null;
}

export async function updateEmailCampaign(id: string, data: any) {
  // no-op
}

export async function updateCampaignStatus(id: string, status: CampaignStatus) {
  // no-op
}

export async function deleteEmailCampaign(id: string) {
  // no-op
}

export async function createEmailTemplate(data: any) {
  return 'mock-template-id';
}

export async function getEmailTemplates() {
  return [];
}

export async function getEmailTemplate(id: string) {
  return null;
}

export async function updateEmailTemplate(id: string, data: any) {
  // no-op
}

export async function deleteEmailTemplate(id: string) {
  // no-op
}

export async function trackEmailOpen(campaignId: string, recipientId: string) {
  // no-op
}

export async function trackEmailClick(campaignId: string, recipientId: string, link: string) {
  // no-op
}
