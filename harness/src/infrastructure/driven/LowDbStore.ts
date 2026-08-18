import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import type { Agent } from '@/domain/Agent'
import type { Budget } from '@/domain/Budget'
import type { Permission } from '@/domain/Permission'
import type { Rule } from '@/domain/Rule'
import type { Session } from '@/domain/Session'

export interface HarnessDbSchema {
	agents: Agent[]
	rules: Rule[]
	budgets: Budget[]
	permissions: Permission[]
	sessions: Session[]
}

const defaultData: HarnessDbSchema = {
	agents: [],
	rules: [],
	budgets: [],
	permissions: [],
	sessions: [],
}

export default class LowDbStore {
	readonly db: Low<HarnessDbSchema>
	private readonly filePath: string

	constructor(filePath: string) {
		this.filePath = filePath
		const adapter = new JSONFile<HarnessDbSchema>(filePath)
		this.db = new Low(adapter, defaultData)
	}

	async init(): Promise<void> {
		mkdirSync(dirname(this.filePath), { recursive: true })
		await this.db.read()
		if (this.db.data === null) {
			this.db.data = defaultData
			await this.db.write()
		}
	}

	async persist(): Promise<void> {
		await this.db.write()
	}
}
