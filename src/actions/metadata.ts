'use server';

import {
  createMetafieldDefinition,
  getMetafieldDefinition,
  setMetafield,
  getMetafields,
  deleteMetafield,
  getMetafieldDefinitions,
  updateMetafieldDefinition,
  deleteMetafieldDefinition
} from '../lib/metafields';
import {
  defineMetaobject,
  createMetaobject,
  getMetaobject,
  getMetaobjectDefinition,
  getMetaobjectDefinitions,
  updateMetaobjectDefinition,
  deleteMetaobjectDefinition,
  getMetaobjects
} from '../lib/metaobjects';
import { revalidatePath } from 'next/cache';

// ----------------------------------------------------------------------
// Metafield Definitions
// ----------------------------------------------------------------------

export async function createMetafieldDefinitionAction(data: {
  namespace: string;
  key: string;
  ownerType: string;
  type: string;
  name: string;
  description?: string;
  validation?: any;
}) {
  try {
    // TODO: Add Authorization check here (e.g. checkRole('admin'))
    const id = await createMetafieldDefinition({
      namespace: data.namespace,
      key: data.key,
      owner_type: data.ownerType,
      type: data.type,
      name: data.name,
      description: data.description,
      validation: data.validation
    });
    revalidatePath('/admin/settings/metafields');
    return { success: true, id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMetafieldDefinitionsAction(ownerType?: string) {
  try {
    const defs = await getMetafieldDefinitions(ownerType);
    return { success: true, data: defs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMetafieldDefinitionAction(id: number, data: any) {
  try {
    await updateMetafieldDefinition(id, data);
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMetafieldDefinitionAction(id: number) {
  try {
    await deleteMetafieldDefinition(id);
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------------------------
// Metafields
// ----------------------------------------------------------------------

export async function updateMetafieldAction(
  ownerType: string,
  ownerId: string,
  namespace: string,
  key: string,
  value: any,
  valueType: string
) {
  try {
    await setMetafield(ownerType, ownerId, namespace, key, value, valueType);
    revalidatePath(`/admin/${ownerType}s/${ownerId}`); // Heuristic revalidation
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMetafieldAction(id: number, path?: string) {
  try {
    await deleteMetafield(id);
    if (path) revalidatePath(path);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMetafieldsAction(ownerType: string, ownerId: string) {
  try {
    const metafields = await getMetafields(ownerType, ownerId);
    return { success: true, data: metafields };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------------------------
// Metaobjects
// ----------------------------------------------------------------------

export async function defineMetaobjectAction(type: string, name: string, fields: any[]) {
  try {
    const id = await defineMetaobject(type, name, fields);
    revalidatePath('/admin/start/metaobjects');
    return { success: true, id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMetaobjectDefinitionsAction() {
  try {
    const defs = await getMetaobjectDefinitions();
    return { success: true, data: defs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMetaobjectDefinitionAction(type: string) {
  try {
    const def = await getMetaobjectDefinition(type);
    return { success: true, data: def };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMetaobjectDefinitionAction(id: number, data: any) {
  try {
    await updateMetaobjectDefinition(id, data);
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMetaobjectDefinitionAction(id: number) {
  try {
    await deleteMetaobjectDefinition(id);
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMetaobjectAction(type: string, handle: string, displayName: string, fields: Record<string, any>) {
  try {
    const id = await createMetaobject(type, handle, displayName, fields);
    revalidatePath(`/admin/metaobjects/${type}`);
    return { success: true, id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMetaobjectAction(handle: string) {
  try {
    const obj = await getMetaobject(handle);
    return { success: true, data: obj };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMetaobjectsAction(type?: string) {
  try {
    const objects = await getMetaobjects(type);
    return { success: true, data: objects };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
