import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export type CampaignStatus = 'draft' | 'scheduled' | 'sent' | 'cancelled';
export type CampaignType = 'promotional' | 'newsletter' | 'abandoned-cart' | 'transactional';

// Email Campaign Operations
export async function createEmailCampaign(data: {
  name: string;
  subject: string;
  content: string;
  type: CampaignType;
  recipientType: 'all' | 'group' | 'segment' | 'individual';
  recipientIds?: string[];
  scheduledFor?: Date;
}) {
  const campaignsRef = collection(db, 'emailCampaigns');
  const docRef = await addDoc(campaignsRef, {
    ...data,
    status: 'draft',
    sentCount: 0,
    openCount: 0,
    clickCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getEmailCampaigns() {
  const campaignsRef = collection(db, 'emailCampaigns');
  const snapshot = await getDocs(campaignsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getEmailCampaign(id: string) {
  const docRef = doc(db, 'emailCampaigns', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as any;
  }
  return null;
}

export async function updateEmailCampaign(id: string, data: Partial<{
  name: string;
  subject: string;
  content: string;
  recipientType: string;
  recipientIds: string[];
  scheduledFor: Date;
}>) {
  const docRef = doc(db, 'emailCampaigns', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function updateCampaignStatus(id: string, status: CampaignStatus) {
  const docRef = doc(db, 'emailCampaigns', id);
  const updateData: any = {
    status,
    updatedAt: Timestamp.now(),
  };

  if (status === 'sent') {
    updateData.sentAt = Timestamp.now();
  }

  await updateDoc(docRef, updateData);
}

export async function deleteEmailCampaign(id: string) {
  const docRef = doc(db, 'emailCampaigns', id);
  await deleteDoc(docRef);
}

// Email Templates
export async function createEmailTemplate(data: {
  name: string;
  subject: string;
  content: string;
  type: CampaignType;
  variables?: string[];
}) {
  const templatesRef = collection(db, 'emailTemplates');
  const docRef = await addDoc(templatesRef, {
    ...data,
    variables: data.variables || [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getEmailTemplates() {
  const templatesRef = collection(db, 'emailTemplates');
  const snapshot = await getDocs(templatesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getEmailTemplate(id: string) {
  const docRef = doc(db, 'emailTemplates', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function updateEmailTemplate(id: string, data: any) {
  const docRef = doc(db, 'emailTemplates', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteEmailTemplate(id: string) {
  const docRef = doc(db, 'emailTemplates', id);
  await deleteDoc(docRef);
}

// Campaign Analytics
export async function trackEmailOpen(campaignId: string, recipientId: string) {
  const campaign = await getEmailCampaign(campaignId);
  if (!campaign) return;

  const docRef = doc(db, 'emailCampaigns', campaignId);
  await updateDoc(docRef, {
    openCount: (campaign.openCount || 0) + 1,
  });

  // Record individual open
  const opensRef = collection(db, 'emailOpens');
  await addDoc(opensRef, {
    campaignId,
    recipientId,
    openedAt: Timestamp.now(),
  });
}

export async function trackEmailClick(campaignId: string, recipientId: string, link: string) {
  const campaign = await getEmailCampaign(campaignId);
  if (!campaign) return;

  const docRef = doc(db, 'emailCampaigns', campaignId);
  await updateDoc(docRef, {
    clickCount: (campaign.clickCount || 0) + 1,
  });

  // Record individual click
  const clicksRef = collection(db, 'emailClicks');
  await addDoc(clicksRef, {
    campaignId,
    recipientId,
    link,
    clickedAt: Timestamp.now(),
  });
}
