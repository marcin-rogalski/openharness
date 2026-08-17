import type { HookContext, HookResult } from '@/domain/Hook'

export interface HookPort {
	readonly id: string
	readonly priority: number
	invoke(context: HookContext, payload: unknown): Promise<HookResult>
}

export interface SessionHook extends HookPort {}
export interface TurnHook extends HookPort {}
export interface StepHook extends HookPort {}
export interface ToolHook extends HookPort {}
export interface PolicyHook extends HookPort {}
export interface SandboxHook extends HookPort {}
export interface EventHook extends HookPort {}
