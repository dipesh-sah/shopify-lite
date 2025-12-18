
"use server"

import { revalidatePath } from "next/cache";
import {
  getRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,
  Rule
} from "@/lib/rules/service";
import { RuleEngine, RulePayload, RuleContext } from "@/lib/rules/engine";

export async function getRulesAction(moduleType?: string) {
  try {
    const rules = await getRules(moduleType);
    return { rules };
  } catch (error) {
    console.error("Error fetching rules:", error);
    return { rules: [] };
  }
}

export async function getRuleAction(id: string) {
  try {
    const rule = await getRule(id);
    return { rule };
  } catch (error) {
    console.error("Error fetching rule:", error);
    return { rule: null };
  }
}

export async function createRuleAction(data: {
  name: string;
  description?: string;
  priority?: number;
  payload: RulePayload;
  module_type?: string;
  is_active?: boolean;
}) {
  try {
    const id = await createRule(data);
    revalidatePath('/admin/rules');
    return { success: true, id };
  } catch (error) {
    console.error("Error creating rule:", error);
    return { success: false, error: "Failed to create rule" };
  }
}

export async function updateRuleAction(id: string, data: {
  name?: string;
  description?: string;
  priority?: number;
  payload?: RulePayload;
  module_type?: string;
  is_active?: boolean;
}) {
  try {
    await updateRule(id, data);
    revalidatePath('/admin/rules');
    revalidatePath(`/admin/rules/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating rule:", error);
    return { success: false, error: "Failed to update rule" };
  }
}

export async function deleteRuleAction(id: string) {
  try {
    await deleteRule(id);
    revalidatePath('/admin/rules');
    return { success: true };
  } catch (error) {
    console.error("Error deleting rule:", error);
    return { success: false, error: "Failed to delete rule" };
  }
}

// --- Testing Action ---

export async function evaluateRuleAction(payload: RulePayload, context: RuleContext) {
  try {
    const result = RuleEngine.evaluate(payload, context);
    return { success: true, result };
  } catch (error) {
    console.error("Error evaluating rule:", error);
    return { success: false, error: "Evaluation failed" };
  }
}
