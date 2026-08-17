import { describe, expect, it, vi } from 'vitest'
import type { ApprovalPort } from '@/application/ports/adapters/ApprovalPort'
import DenyToolCallUsecase from './DenyToolCallUsecase'

describe('DenyToolCallUsecase', () => {
	it('records a denial decision', async () => {
		const decide = vi.fn()
		const approval = { requestApproval: vi.fn(), decide } as ApprovalPort
		const usecase = new DenyToolCallUsecase(approval)

		const result = await usecase.handle({ toolCallId: 'call-1' })

		expect(result).toEqual({ toolCallId: 'call-1', denied: true })
		expect(decide).toHaveBeenCalledWith('call-1', 'denied')
	})

	it('rejects empty toolCallId', async () => {
		const approval = {
			requestApproval: vi.fn(),
			decide: vi.fn(),
		} as ApprovalPort
		const usecase = new DenyToolCallUsecase(approval)

		await expect(usecase.handle({ toolCallId: '' })).rejects.toThrow()
	})
})
