import { describe, expect, it, vi } from 'vitest'
import type { ApprovalPort } from '@/application/ports/adapters/ApprovalPort'
import ApproveToolCallUsecase from './ApproveToolCallUsecase'

describe('ApproveToolCallUsecase', () => {
	it('records an approval decision', async () => {
		const decide = vi.fn()
		const approval = { requestApproval: vi.fn(), decide } as ApprovalPort
		const usecase = new ApproveToolCallUsecase(approval)

		const result = await usecase.handle({ toolCallId: 'call-1' })

		expect(result).toEqual({ toolCallId: 'call-1', approved: true })
		expect(decide).toHaveBeenCalledWith('call-1', 'approved')
	})

	it('rejects empty toolCallId', async () => {
		const approval = {
			requestApproval: vi.fn(),
			decide: vi.fn(),
		} as ApprovalPort
		const usecase = new ApproveToolCallUsecase(approval)

		await expect(usecase.handle({ toolCallId: '' })).rejects.toThrow()
	})
})
