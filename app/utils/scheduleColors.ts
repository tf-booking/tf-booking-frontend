type AppointmentLike = {
    id: number
    status: string
}

export type AppointmentColors = {
    backgroundColor: string
    borderColor: string
    textColor: string
}

export const getAppointmentColors = (appointment: AppointmentLike, isNext: boolean): AppointmentColors => {
    const isNoShow = appointment.status === 'no_show'

    if (isNoShow) {
        return { backgroundColor: '#f0ece2', borderColor: '#d8d1c3', textColor: '#8a857a' }
    }

    if (isNext) {
        return { backgroundColor: '#d7ff3e', borderColor: '#c2e800', textColor: '#0b0b0f' }
    }

    return { backgroundColor: '#0b0b0f', borderColor: '#0b0b0f', textColor: '#ffffff' }
}

export const getBlockColors = (): AppointmentColors => {
    return { backgroundColor: '#fee2e2', borderColor: '#ef4444', textColor: '#991b1b' }
}

export const getClosedDayColors = (): AppointmentColors => {
    return { backgroundColor: 'rgba(100, 116, 139, 0.18)', borderColor: '#64748b', textColor: '#334155' }
}

type AppointmentWithStart = AppointmentLike & { start_at: string }

export const findNextAppointmentId = (appointments: AppointmentWithStart[]): number | null => {
    const now = Date.now()
    let candidate: AppointmentWithStart | null = null

    for (const appointment of appointments) {
        if (appointment.status !== 'confirmed') {
            continue
        }

        if (new Date(appointment.start_at).getTime() < now) {
            continue
        }

        if (!candidate || new Date(appointment.start_at).getTime() < new Date(candidate.start_at).getTime()) {
            candidate = appointment
        }
    }

    return candidate?.id ?? null
}
