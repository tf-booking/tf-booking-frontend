export type StaffMember = {
    id: number
    uuid: string
    business: number
    business_name: string
    user: number | null
    services: number[]
    services_names: string[]
    name: string
    email: string
    phone: string
    bio: string
    avatar_url: string
    is_active: boolean
}

export type WorkingHour = {
    id: number
    staff_member: number
    staff_member_name: string
    business_name: string
    weekday: number
    weekday_label: string
    start_time: string
    end_time: string
    is_active: boolean
}

export type StaffBlock = {
    id: number
    uuid: string
    staff_member: number
    staff_member_name: string
    business_name: string
    start_at: string
    end_at: string
    reason: string
    created_at: string
}

export type Appointment = {
    id: number
    uuid: string
    business: number
    service: number
    service_name: string
    staff_member: number
    staff_member_name: string
    customer: number
    customer_name: string
    customer_phone: string
    start_at: string
    end_at: string
    status: string
    source: string
    notes: string
    cancellation_reason: string
}
