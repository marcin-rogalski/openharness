const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/

export interface NormalizedEvent {
	id: string
	timestamp: string
}

export function normalizeId(id: string, index: number): string {
	if (UUID_PATTERN.test(id)) {
		return `id-${index}`
	}
	return id
}

export function normalizeTimestamp(timestamp: string): string {
	if (TIMESTAMP_PATTERN.test(timestamp)) {
		return '2026-01-01T00:00:00Z'
	}
	return timestamp
}

export function normalizeEvent<T extends NormalizedEvent>(
	event: T,
	index: number,
): T {
	const normalized = { ...event }
	if (normalized.id) {
		normalized.id = normalizeId(normalized.id, index)
	}
	if (normalized.timestamp) {
		normalized.timestamp = normalizeTimestamp(normalized.timestamp)
	}
	const record = normalized as Record<string, unknown>
	if (
		typeof record.sessionId === 'string' &&
		UUID_PATTERN.test(record.sessionId)
	) {
		record.sessionId = 'session-normalized'
	}
	if (
		typeof record.projectId === 'string' &&
		UUID_PATTERN.test(record.projectId)
	) {
		record.projectId = 'project-normalized'
	}
	return normalized
}

export function normalizeEvents<T extends NormalizedEvent>(events: T[]): T[] {
	return events.map((event, index) => normalizeEvent(event, index))
}

export function redactSecrets(text: string): string {
	return text.replace(
		/((?:api[_-]?key|token|secret|password|authorization)\s*[:=]\s*)[\w./-]+/gi,
		'$1[REDACTED]',
	)
}
