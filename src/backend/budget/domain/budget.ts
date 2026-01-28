import { BudgetClientData } from '@/components/budget-request/schema';

export interface BudgetLineItem {
  order: number;
  originalTask: string;
  found: boolean;
  item?: {
    code: string;
    description: string;
    unit: string;
    price?: number;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
  };
  note?: string;
  id?: string; // Added for editor
  isEditing?: boolean; // For editor state
  chapter?: string; // Grouping category (e.g., "Demoliciones")
  originalState?: { // Snapshot for comparison/ghost mode
    unitPrice: number;
    quantity: number;
    description: string;
    unit: string;
  };
}

export interface BudgetCostBreakdown {
  materialExecutionPrice: number;
  overheadExpenses: number;
  industrialBenefit: number;
  tax: number;
  globalAdjustment: number;
  total: number;
}

/**
 * Represents the core Budget entity in the domain layer.
 */
export interface Budget {
  id: string;
  userId?: string; // Optional if guest

  // Metadata
  status: 'draft' | 'pending_review' | 'approved' | 'sent';
  createdAt: Date;
  updatedAt: Date;
  version: number;
  type?: 'renovation' | 'quick' | 'new_build'; // Discriminator

  // Client & Project Info (from form)
  clientData: BudgetClientData;

  // Financials
  lineItems: BudgetLineItem[];
  costBreakdown: BudgetCostBreakdown;
  totalEstimated: number;

  // AI Renders (Dream Renovator)
  renders?: BudgetRender[];
}

export interface BudgetRender {
  id: string;
  url: string;
  originalUrl?: string; // Optional: store the "before" image too
  prompt: string;
  style: string;
  roomType: string;
  createdAt: Date;
}

/**
 * Represents a repository interface for budget data persistence.
 */
export interface BudgetRepository {
  findById(id: string): Promise<Budget | null>;
  findByUserId(userId: string): Promise<Budget[]>;
  findAll(): Promise<Budget[]>; // For admin list
  save(budget: Budget): Promise<void>;
}
