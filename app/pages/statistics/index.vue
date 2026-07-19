<template>
    <div class="page statistics-page">
        <section class="container">
            <div class="statistics-header">
                <p class="tf-eyebrow">Estatísticas</p>
                <h1>{{ selectedBusiness?.name || 'Estatísticas' }}</h1>
            </div>

            <div class="card filters-card">
                <div class="filters-row">
                    <div class="filter-field">
                        <label class="label">De</label>
                        <DateField v-model="startDate" />
                    </div>

                    <div class="filter-field">
                        <label class="label">Até</label>
                        <DateField v-model="endDate" />
                    </div>

                    <div class="filter-presets">
                        <button type="button" class="mini-action" @click="applyPreset('this-month')">
                            Este mês
                        </button>
                        <button type="button" class="mini-action" @click="applyPreset('last-month')">
                            Mês passado
                        </button>
                        <button
                            type="button"
                            class="mini-action"
                            :disabled="isFree || isLoadingStats || isExporting || !selectedBusiness"
                            @click="exportToExcel"
                        >
                            {{ isExporting ? 'A exportar...' : 'Exportar Excel' }}
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="isLoadingBusinesses" class="card empty-card">
                A carregar negócio...
            </div>

            <div v-else-if="!selectedBusiness" class="card empty-card">
                Este utilizador ainda não tem nenhum negócio associado.
            </div>

            <template v-else>
                <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

                <ProLock
                    :locked="isFree"
                    message="As estatísticas do negócio estão disponíveis no plano Pro."
                >
                    <div class="kpi-grid">
                        <article class="kpi kpi-dark">
                            <p class="kpi-label kpi-label-accent">Marcações</p>
                            <div class="kpi-value">{{ isFree ? '128' : (isLoadingStats ? '—' : statistics.appointments_count) }}</div>
                            <p class="kpi-foot">Não inclui canceladas</p>
                        </article>

                        <article class="kpi">
                            <p class="kpi-label">Volume faturado</p>
                            <div class="kpi-value">{{ isFree ? formatCurrency(2140) : (isLoadingStats ? '—' : formatCurrency(statistics.revenue_total)) }}</div>
                            <p class="kpi-foot">Marcações já realizadas</p>
                        </article>
                    </div>

                    <div class="statistics-grid">
                        <article class="card panel">
                            <div class="panel-head">
                                <h2>Top serviços</h2>
                            </div>

                            <p v-if="isLoadingStats && !isFree" class="muted-text">A carregar...</p>

                            <p v-else-if="!isFree && statistics.top_services.length === 0" class="muted-text">
                                Sem marcações neste período.
                            </p>

                            <div v-else class="bar-list">
                                <div v-for="row in (isFree ? demoServiceRows : statistics.top_services)" :key="row.service_uuid" class="bar-row">
                                    <div class="bar-row-top">
                                        <span class="bar-label">{{ row.service_name }}</span>
                                        <span class="bar-value">{{ row.count }}</span>
                                    </div>
                                    <div class="bar-track">
                                        <div class="bar-fill" :style="{ width: barWidth(row.count, isFree ? 69 : maxServiceCount) + '%' }"></div>
                                    </div>
                                </div>
                            </div>
                        </article>

                        <article class="card panel">
                            <div class="panel-head">
                                <h2>Marcações por colaborador</h2>
                            </div>

                            <p v-if="isLoadingStats && !isFree" class="muted-text">A carregar...</p>

                            <p v-else-if="!isFree && statistics.appointments_by_staff.length === 0" class="muted-text">
                                Sem marcações neste período.
                            </p>

                            <div v-else class="bar-list">
                                <div v-for="row in (isFree ? demoStaffRows : statistics.appointments_by_staff)" :key="row.staff_uuid" class="bar-row">
                                    <div class="bar-row-top">
                                        <span class="bar-label">{{ row.staff_name }}</span>
                                        <span class="bar-value">{{ row.count }}</span>
                                    </div>
                                    <div class="bar-track">
                                        <div class="bar-fill" :style="{ width: barWidth(row.count, isFree ? 123 : maxStaffCount) + '%' }"></div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </div>
                </ProLock>
            </template>
        </section>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: ['auth', 'owner-only'],
    layout: 'backoffice',
})

type Business = {
    id: number
    uuid: string
    name: string
    slug: string
    is_active: boolean
}

type StatServiceRow = {
    service_uuid: string
    service_name: string
    count: number
}

type StatStaffRow = {
    staff_uuid: string
    staff_name: string
    count: number
}

type Statistics = {
    start_date: string
    end_date: string
    appointments_count: number
    revenue_total: string
    top_services: StatServiceRow[]
    appointments_by_staff: StatStaffRow[]
}

const emptyStatistics: Statistics = {
    start_date: '',
    end_date: '',
    appointments_count: 0,
    revenue_total: '0.00',
    top_services: [],
    appointments_by_staff: [],
}

const { apiFetch } = useApi()
const { isFree } = usePlan()

const businesses = ref<Business[]>([])
const selectedBusiness = ref<Business | null>(null)
const isLoadingBusinesses = ref(false)

const statistics = ref<Statistics>({ ...emptyStatistics })

const demoServiceRows: StatServiceRow[] = [
    { service_uuid: 'demo-1', service_name: 'Corte de cabelo', count: 69 },
    { service_uuid: 'demo-2', service_name: 'Corte + Barba', count: 47 },
    { service_uuid: 'demo-3', service_name: 'Barba', count: 12 },
]

const demoStaffRows: StatStaffRow[] = [
    { staff_uuid: 'demo-1', staff_name: 'Pedro', count: 123 },
    { staff_uuid: 'demo-2', staff_name: 'Kiko', count: 16 },
]
const isLoadingStats = ref(false)
const errorMessage = ref('')

const formatIso = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0)

const today = new Date()

const startDate = ref(formatIso(startOfMonth(today)))
const endDate = ref(formatIso(endOfMonth(today)))

const maxServiceCount = computed(() =>
    Math.max(1, ...statistics.value.top_services.map((row) => row.count))
)

const maxStaffCount = computed(() =>
    Math.max(1, ...statistics.value.appointments_by_staff.map((row) => row.count))
)

const barWidth = (count: number, max: number) => {
    if (!count) {
        return 0
    }

    return Math.max(4, Math.round((count / max) * 100))
}

const formatCurrency = (value: string | number) => {
    const amount = Number(value || 0)

    return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0)
}

const applyPreset = (preset: 'this-month' | 'last-month') => {
    const base = new Date()
    const reference = preset === 'last-month'
        ? new Date(base.getFullYear(), base.getMonth() - 1, 1)
        : base

    startDate.value = formatIso(startOfMonth(reference))
    endDate.value = formatIso(endOfMonth(reference))
}

const loadBusinesses = async () => {
    try {
        isLoadingBusinesses.value = true

        const response = await apiFetch<{
            count: number
            next: string | null
            previous: string | null
            results: Business[]
        }>('/businesses/')

        businesses.value = response.results
        selectedBusiness.value = businesses.value[0] || null
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível carregar o negócio do utilizador.'
    } finally {
        isLoadingBusinesses.value = false
    }
}

const loadStatistics = async () => {
    if (!selectedBusiness.value || !startDate.value || !endDate.value) {
        return
    }

    if (isFree.value) {
        return
    }

    try {
        isLoadingStats.value = true
        errorMessage.value = ''

        const params = new URLSearchParams({
            business: String(selectedBusiness.value.id),
            start_date: startDate.value,
            end_date: endDate.value,
        })

        statistics.value = await apiFetch<Statistics>(`/appointments/statistics/?${params.toString()}`)
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível carregar as estatísticas.'
        statistics.value = { ...emptyStatistics }
    } finally {
        isLoadingStats.value = false
    }
}

type ExportAppointment = {
    uuid: string
    start_at: string
    staff_member_name: string
    customer_name: string
    service_name: string
    final_price: string
    status: string
}

const isExporting = ref(false)

const loadAllAppointments = async () => {
    const rows: ExportAppointment[] = []
    let page = 1

    while (true) {
        const params = new URLSearchParams({
            business: String(selectedBusiness.value!.id),
            start_date: startDate.value,
            end_date: endDate.value,
            page: String(page),
        })

        const response = await apiFetch<{
            next: string | null
            results: ExportAppointment[]
        }>(`/appointments/?${params.toString()}`)

        rows.push(...response.results)

        if (!response.next) {
            return rows
        }

        page += 1
    }
}

const exportToExcel = async () => {
    if (!selectedBusiness.value || isFree.value || isExporting.value) {
        return
    }

    try {
        isExporting.value = true
        errorMessage.value = ''

        const [{ default: ExcelJS }, allAppointments] = await Promise.all([
            import('exceljs'),
            loadAllAppointments(),
        ])

        const appointments = allAppointments.filter(
            (appointment) => appointment.status !== 'cancelled'
        )

        const statusLabels: Record<string, string> = {
            pending: 'Pendente',
            confirmed: 'Confirmada',
            completed: 'Concluída',
            no_show: 'Não apareceu',
        }

        // Mesma regra do "Volume faturado" das estatísticas: só conta valor
        // uma marcação confirmada/concluída que já aconteceu. Pendentes,
        // futuras e "não apareceu" ficam a 0 para o total do Excel bater
        // certo com o ecrã.
        const now = Date.now()
        const realizedValue = (appointment: ExportAppointment) => {
            const happened = new Date(appointment.start_at).getTime() <= now
            const counts = appointment.status === 'confirmed' || appointment.status === 'completed'

            return happened && counts ? Number(appointment.final_price || 0) : 0
        }

        const formatDate = new Intl.DateTimeFormat('pt-PT', {
            dateStyle: 'short',
            timeStyle: 'short',
        })

        const BLACK = 'FF0B0B0F'
        const ACCENT = 'FFD7FF3E'
        const BORDER = 'FFE6E1D5'
        const STRIPE = 'FFF7F5EF'
        const MUTED = 'FF6F6A5E'

        const workbook = new ExcelJS.Workbook()
        const sheet = workbook.addWorksheet('Reservas', {
            views: [{ state: 'frozen', ySplit: 4 }],
        })

        sheet.columns = [
            { width: 20 },
            { width: 26 },
            { width: 26 },
            { width: 30 },
            { width: 16 },
            { width: 14 },
        ]

        // Cabeçalho do documento
        sheet.mergeCells('A1:F1')
        const titleCell = sheet.getCell('A1')
        titleCell.value = `Reservas — ${selectedBusiness.value.name}`
        titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: BLACK } }
        sheet.getRow(1).height = 28

        sheet.mergeCells('A2:F2')
        const periodCell = sheet.getCell('A2')
        periodCell.value = `Período: ${startDate.value} a ${endDate.value} · ${appointments.length} reservas`
        periodCell.font = { name: 'Calibri', size: 11, italic: true, color: { argb: MUTED } }
        sheet.getRow(2).height = 18

        // Cabeçalho da tabela
        const headerRow = sheet.getRow(4)
        headerRow.values = ['Data', 'Colaborador', 'Cliente', 'Serviço', 'Estado', 'Valor']
        headerRow.height = 24
        headerRow.eachCell((cell) => {
            cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLACK } }
            cell.alignment = { vertical: 'middle' }
            cell.border = {
                bottom: { style: 'medium', color: { argb: ACCENT } },
            }
        })

        // Linhas de dados
        appointments.forEach((appointment, index) => {
            const row = sheet.getRow(5 + index)
            row.values = [
                formatDate.format(new Date(appointment.start_at)),
                appointment.staff_member_name,
                appointment.customer_name,
                appointment.service_name,
                statusLabels[appointment.status] || appointment.status,
                realizedValue(appointment),
            ]
            row.height = 18

            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                cell.font = { name: 'Calibri', size: 11, color: { argb: BLACK } }
                cell.alignment = { vertical: 'middle' }
                cell.border = {
                    bottom: { style: 'thin', color: { argb: BORDER } },
                }

                if (index % 2 === 1) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STRIPE } }
                }

                if (colNumber === 6) {
                    cell.numFmt = '#,##0.00" €"'
                }
            })
        })

        // Linha de total
        const totalRow = sheet.getRow(5 + appointments.length)
        totalRow.getCell(5).value = 'Total faturado'
        totalRow.getCell(6).value = {
            formula: `SUM(F5:F${4 + Math.max(appointments.length, 1)})`,
            result: appointments.reduce(
                (sum, appointment) => sum + realizedValue(appointment),
                0
            ),
        }
        totalRow.height = 22
        ;[5, 6].forEach((colNumber) => {
            const cell = totalRow.getCell(colNumber)
            cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: BLACK } }
            cell.alignment = { vertical: 'middle' }
            cell.border = { top: { style: 'medium', color: { argb: BLACK } } }
        })
        totalRow.getCell(6).numFmt = '#,##0.00" €"'

        sheet.autoFilter = { from: 'A4', to: 'F4' }

        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `reservas_${selectedBusiness.value.slug}_${startDate.value}_${endDate.value}.xlsx`
        link.click()
        URL.revokeObjectURL(url)
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível exportar as reservas.'
    } finally {
        isExporting.value = false
    }
}

watch([startDate, endDate], () => {
    loadStatistics()
})

onMounted(async () => {
    await loadBusinesses()
    await loadStatistics()
})
</script>

<style scoped>
.statistics-page {
    padding: 48px 0 88px;
}

.statistics-header {
    margin-bottom: 20px;
}

.statistics-header h1 {
    margin: 0;
    font-size: clamp(32px, 4vw, 40px);
    letter-spacing: -0.045em;
}

.filters-card {
    display: flex;
    margin-bottom: 16px;
    padding: 20px 22px;
}

.filters-row {
    display: flex;
    align-items: flex-end;
    gap: 16px;
    flex-wrap: wrap;
    width: 100%;
}

.filter-field {
    min-width: 180px;
}

.filter-presets {
    display: flex;
    gap: 8px;
    margin-left: auto;
    align-self: center;
}

.empty-card {
    padding: 40px;
    text-align: center;
    color: var(--tf-muted);
    font-weight: 700;
}

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 16px;
}

.kpi {
    padding: 22px;
    border-radius: 22px;
    background: #fff;
    border: 1px solid var(--tf-border);
}

.kpi-dark {
    background: var(--tf-black);
    color: #fff;
    border-color: var(--tf-black);
}

.kpi-label {
    margin: 0 0 18px;
    font-family: var(--tf-mono);
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.kpi-label-accent {
    color: var(--tf-accent);
}

.kpi-value {
    font-size: 46px;
    font-weight: 900;
    letter-spacing: -0.05em;
    line-height: 1;
}

.kpi-foot {
    margin: 10px 0 0;
    font-size: 12px;
    color: var(--tf-muted);
}

.kpi-dark .kpi-foot {
    color: #b7b3aa;
}

.statistics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.panel {
    padding: 24px;
}

.panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
}

.panel h2 {
    margin: 0;
    font-size: 19px;
    font-weight: 800;
    letter-spacing: -0.03em;
}

.bar-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.bar-row-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 7px;
}

.bar-label {
    font-size: 13px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.bar-value {
    flex-shrink: 0;
    font-family: var(--tf-mono);
    font-size: 13px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: var(--tf-muted);
}

.bar-track {
    height: 10px;
    border-radius: 99px;
    background: #eee8da;
    overflow: hidden;
}

.bar-fill {
    height: 100%;
    background: var(--tf-accent);
}

.mini-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    padding: 0 14px;
    border: 1px solid var(--tf-border);
    border-radius: 999px;
    background: #fff;
    color: var(--tf-black);
    font-family: var(--tf-sans);
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
}

.mini-action:hover {
    box-shadow: 0 12px 26px -14px rgba(11, 11, 15, 0.3);
}

.mini-action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
}

.muted-text {
    color: var(--tf-muted);
    font-weight: 700;
}

.error-message {
    margin: 0 0 16px;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tf-danger-bg);
    color: var(--tf-danger-fg);
    font-weight: 700;
}

@media (max-width: 900px) {
    .statistics-grid {
        grid-template-columns: 1fr;
    }

    .kpi-grid {
        grid-template-columns: 1fr;
    }

    .filters-row {
        flex-direction: column;
        align-items: stretch;
    }

    .filter-presets {
        margin-left: 0;
    }
}
</style>
