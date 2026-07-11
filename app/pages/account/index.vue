<template>
    <div class="page account-page">
        <section class="container">
            <div class="account-head">
                <p class="tf-eyebrow">Conta</p>
                <h1>Definições</h1>
            </div>

            <div class="account-user card">
                <span class="account-user-avatar">{{ userInitials }}</span>
                <div class="account-user-copy">
                    <div class="account-user-name">{{ fullName }}</div>
                    <div class="account-user-sub">{{ accountUserSub }}</div>
                </div>
            </div>

            <div v-if="isLoadingProfile" class="card state-card">
                A carregar perfil...
            </div>

            <template v-else>
                <div class="tabs">
                    <button
                        v-for="tab in tabs"
                        :key="tab.key"
                        type="button"
                        class="tab"
                        :class="{ active: activeTab === tab.key }"
                        @click="setTab(tab.key)"
                    >
                        {{ tab.label }}
                    </button>
                </div>

                <!-- PERFIL -->
                <div v-show="activeTab === 'perfil'" class="panel">
                    <article class="card form-card">
                        <div class="section-head">
                            <div>
                                <p class="section-label">Dados principais</p>
                                <h2>Informacao pessoal</h2>
                            </div>
                        </div>

                        <form class="form" @submit.prevent="saveProfile">
                            <div class="two-columns">
                                <div>
                                    <label class="label">Primeiro nome</label>
                                    <input v-model="form.first_name" class="input" type="text" placeholder="Antonio" />
                                </div>

                                <div>
                                    <label class="label">Ultimo nome</label>
                                    <input v-model="form.last_name" class="input" type="text" placeholder="Silva" />
                                </div>
                            </div>

                            <div class="two-columns">
                                <div>
                                    <label class="label">Username</label>
                                    <input v-model="form.username" class="input" type="text" placeholder="antonio" />
                                </div>

                                <div>
                                    <label class="label">Email</label>
                                    <input v-model="form.email" class="input" type="email" placeholder="antonio@email.pt" />
                                </div>
                            </div>

                            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
                            <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

                            <div class="form-actions">
                                <button class="btn btn-accent" type="submit" :disabled="isSavingProfile">
                                    {{ isSavingProfile ? 'A guardar...' : 'Guardar perfil' }}
                                </button>
                            </div>
                        </form>
                    </article>
                </div>

                <!-- NEGÓCIO -->
                <div
                    v-if="canManageBusiness"
                    v-show="activeTab === 'negocio'"
                    class="panel"
                >
                    <article class="card form-card">
                        <div class="section-head">
                            <div>
                                <p class="section-label">Perfil público do negócio</p>
                                <h2>Perfil do negócio</h2>
                            </div>
                        </div>

                        <form class="form" @submit.prevent="saveBusinessProfile">
                            <ProLock
                                :locked="isFree"
                                message="A personalização do perfil (fotos de capa e galeria) está disponível no plano Pro."
                            >
                                <!-- capa -->
                                <div class="photo-block">
                                    <div class="photo-head">
                                        <div>
                                            <label class="label">Foto de capa</label>
                                            <p class="photo-help">A imagem principal, usada como capa da tua página pública.</p>
                                        </div>

                                        <button class="btn btn-secondary photo-add" type="button" @click="triggerBusinessCoverPicker">
                                            {{ businessCover ? 'Alterar capa' : 'Escolher capa' }}
                                        </button>

                                        <input
                                            ref="businessCoverInputRef"
                                            class="photo-input"
                                            type="file"
                                            accept="image/*"
                                            @change="handleBusinessCoverInput"
                                        />
                                    </div>

                                    <div v-if="businessCover" class="cover-slot">
                                        <img :src="businessCover.url" alt="Capa do negócio" />
                                        <button class="photo-remove" type="button" @click="removeBusinessCover">Remover</button>
                                    </div>

                                    <p v-else class="empty-photo-state">Ainda nao escolheste uma foto de capa.</p>
                                </div>

                                <!-- galeria -->
                                <div class="photo-block">
                                    <div class="photo-head">
                                        <div>
                                            <label class="label">Galeria de fotos</label>
                                            <p class="photo-help">Aparecem na página pública. Máximo {{ maxBusinessGallery }} fotos.</p>
                                        </div>

                                        <button
                                            class="btn btn-secondary photo-add"
                                            type="button"
                                            :disabled="businessGallery.length >= maxBusinessGallery"
                                            @click="triggerBusinessGalleryPicker"
                                        >
                                            Adicionar fotos
                                        </button>

                                        <input
                                            ref="businessGalleryInputRef"
                                            class="photo-input"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            @change="handleBusinessGalleryInput"
                                        />
                                    </div>

                                    <div v-if="businessGallery.length" class="photo-grid">
                                        <article
                                            v-for="(photo, index) in businessGallery"
                                            :key="photo.id"
                                            class="photo-card"
                                        >
                                            <img :src="photo.url" :alt="`Foto ${index + 1}`" />
                                            <div class="photo-meta">
                                                <span class="photo-badge">Foto {{ index + 1 }}</span>
                                                <button class="photo-remove" type="button" @click="removeBusinessGalleryPhoto(photo.id)">
                                                    Remover
                                                </button>
                                            </div>
                                        </article>
                                    </div>

                                    <p v-else class="empty-photo-state">Ainda nao tens fotos na galeria.</p>
                                </div>
                            </ProLock>

                            <div>
                                <label class="label">Nome do negócio</label>
                                <input v-model="businessForm.name" class="input" type="text" placeholder="Estúdio Marta" />
                            </div>

                            <div>
                                <label class="label">Descrição</label>
                                <textarea
                                    v-model="businessForm.description"
                                    class="input textarea"
                                    placeholder="Fala um pouco sobre o teu espaço e serviços."
                                />
                            </div>

                            <div>
                                <label class="label">Categorias</label>

                                <div v-if="businessForm.categories.length" class="cat-chips">
                                    <span v-for="cat in businessForm.categories" :key="cat" class="cat-chip">
                                        {{ cat }}
                                        <button type="button" aria-label="Remover categoria" @click="removeCategory(cat)">×</button>
                                    </span>
                                </div>

                                <div class="cat-input-row">
                                    <input
                                        v-model="newCategory"
                                        class="input"
                                        type="text"
                                        placeholder="Cabelo, Estética, Unhas..."
                                        @keydown.enter.prevent="addCategory"
                                    />
                                    <button class="btn btn-secondary" type="button" @click="addCategory">Adicionar</button>
                                </div>
                            </div>

                            <div class="two-columns">
                                <div>
                                    <label class="label">Telefone</label>
                                    <input v-model="businessForm.phone" class="input" type="text" placeholder="+351 912 345 678" />
                                </div>

                                <div>
                                    <label class="label">Email</label>
                                    <input v-model="businessForm.email" class="input" type="email" placeholder="geral@estudio.pt" />
                                </div>
                            </div>

                            <div>
                                <label class="label">Morada</label>
                                <input v-model="businessForm.address" class="input" type="text" placeholder="Rua das Flores 120" />
                            </div>

                            <div class="two-columns">
                                <div>
                                    <label class="label">Cidade</label>
                                    <input v-model="businessForm.city" class="input" type="text" placeholder="Porto" />
                                </div>

                                <div>
                                    <label class="label">Instagram (URL)</label>
                                    <input v-model="businessForm.instagram_url" class="input" type="url" placeholder="https://instagram.com/..." />
                                </div>
                            </div>

                            <div>
                                <label class="label">Website</label>
                                <input v-model="businessForm.website_url" class="input" type="url" placeholder="https://..." />
                            </div>

                            <label class="switch-row">
                                <span>
                                    <strong>Perfil visível ao público</strong>
                                    <span class="switch-hint">Se desligado, a página pública fica indisponível.</span>
                                </span>
                                <input v-model="businessForm.is_public" type="checkbox" class="switch" />
                            </label>

                            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
                            <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

                            <div class="form-actions">
                                <button class="btn btn-accent" type="submit" :disabled="isSavingBusiness">
                                    {{ isSavingBusiness ? 'A guardar...' : 'Guardar alterações' }}
                                </button>
                            </div>
                        </form>
                    </article>
                </div>

                <!-- PERFIL PÚBLICO -->
                <div
                    v-if="professionalProfileState !== 'hidden'"
                    v-show="activeTab === 'publico'"
                    class="panel"
                >
                    <article class="card form-card professional-card">
                        <div class="section-head">
                            <div>
                                <p class="section-label">Perfil publico</p>
                                <h2>Pagina do colaborador</h2>
                            </div>
                        </div>

                        <div v-if="professionalProfileState === 'missing'" class="state-card inline-state-card">
                            Este utilizador nao tem um perfil profissional associado ao negocio atual.
                        </div>

                        <form v-else class="form" @submit.prevent="saveProfessionalProfile">
                            <div>
                                <label class="label">Descricao</label>
                                <textarea
                                    v-model="professionalForm.bio"
                                    class="input textarea"
                                    placeholder="Fala um pouco sobre o teu trabalho, especialidade e estilo."
                                />
                            </div>

                            <!-- Foto de perfil (imagem principal) -->
                            <div class="photo-block">
                                <div class="photo-head">
                                    <div>
                                        <label class="label">Foto de perfil</label>
                                        <p class="photo-help">A imagem principal que aparece no topo do teu perfil.</p>
                                    </div>

                                    <button
                                        class="btn btn-secondary photo-add"
                                        type="button"
                                        @click="triggerProfilePhotoPicker"
                                    >
                                        {{ profilePhoto ? 'Alterar foto' : 'Escolher foto' }}
                                    </button>

                                    <input
                                        ref="profilePhotoInputRef"
                                        class="photo-input"
                                        type="file"
                                        accept="image/*"
                                        @change="handleProfilePhotoInput"
                                    />
                                </div>

                                <div v-if="profilePhoto" class="profile-photo-slot">
                                    <img :src="profilePhoto.url" alt="Foto de perfil" />
                                    <button class="photo-remove" type="button" @click="removeProfilePhoto">
                                        Remover
                                    </button>
                                </div>

                                <p v-else class="empty-photo-state">
                                    Ainda nao escolheste uma foto de perfil.
                                </p>
                            </div>

                            <!-- Fotos da pagina publica (galeria) -->
                            <div class="photo-block">
                                <div class="photo-head">
                                    <div>
                                        <label class="label">Fotos da pagina</label>
                                        <p class="photo-help">Aparecem na galeria do teu perfil publico. Maximo {{ maxGalleryPhotos }} fotos.</p>
                                    </div>

                                    <button
                                        class="btn btn-secondary photo-add"
                                        type="button"
                                        :disabled="galleryPhotos.length >= maxGalleryPhotos"
                                        @click="triggerGalleryPicker"
                                    >
                                        Adicionar fotos
                                    </button>

                                    <input
                                        ref="galleryInputRef"
                                        class="photo-input"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        @change="handleGalleryInput"
                                    />
                                </div>

                                <div v-if="galleryPhotos.length" class="photo-grid">
                                    <article
                                        v-for="(photo, index) in galleryPhotos"
                                        :key="photo.id"
                                        class="photo-card"
                                    >
                                        <img :src="photo.url" :alt="`Foto ${index + 1}`" />
                                        <div class="photo-meta">
                                            <span class="photo-badge">Foto {{ index + 1 }}</span>
                                            <button class="photo-remove" type="button" @click="removeGalleryPhoto(photo.id)">
                                                Remover
                                            </button>
                                        </div>
                                    </article>
                                </div>

                                <p v-else class="empty-photo-state">
                                    Ainda nao tens fotos na pagina.
                                </p>
                            </div>

                            <p class="security-hint">
                                Estas fotos e descricao aparecem na pagina publica do teu perfil.
                            </p>

                            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
                            <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

                            <div class="form-actions">
                                <button class="btn btn-accent" type="submit" :disabled="isSavingProfessionalProfile">
                                    {{ isSavingProfessionalProfile ? 'A guardar...' : 'Guardar pagina publica' }}
                                </button>
                            </div>
                        </form>
                    </article>
                </div>

                <!-- SEGURANÇA -->
                <!-- PLANO -->
                <div v-if="canManageBusiness" v-show="activeTab === 'plano'" class="panel">
                    <article class="card form-card">
                        <div class="section-head">
                            <div>
                                <p class="section-label">Subscrição</p>
                                <h2>Plano</h2>
                            </div>
                        </div>

                        <p v-if="billingStatusMessage" class="success-message">{{ billingStatusMessage }}</p>
                        <p v-if="billingError" class="error-message">{{ billingError }}</p>

                        <div class="plan-card" :class="{ 'plan-card-pro': isPro }">
                            <span class="plan-card-tag">{{ isPro ? 'PRO' : 'GRÁTIS' }}</span>

                            <template v-if="isPro">
                                <p class="plan-card-title">O teu negócio está no plano Pro.</p>
                                <p class="plan-card-copy">
                                    Subscrição renovada automaticamente até cancelares.
                                    Gere o método de pagamento, vê faturas ou cancela a qualquer momento.
                                </p>
                                <div class="form-actions">
                                    <button
                                        class="btn btn-accent"
                                        type="button"
                                        :disabled="isRedirecting"
                                        @click="openBillingPortal"
                                    >
                                        {{ isRedirecting ? 'A abrir...' : 'Gerir subscrição' }}
                                    </button>
                                </div>
                            </template>

                            <template v-else>
                                <p class="plan-card-title">O teu negócio está no plano Grátis.</p>
                                <p class="plan-card-copy">
                                    Atualiza para o Pro para desbloqueares estatísticas, colaboradores extra,
                                    personalização do perfil e integração com o Google Calendar. Preços + IVA.
                                </p>

                                <div class="plan-interval-grid">
                                    <button
                                        class="plan-interval-option"
                                        :class="{ selected: billingInterval === 'month' }"
                                        type="button"
                                        @click="billingInterval = 'month'"
                                    >
                                        <span class="plan-interval-name">Mensal</span>
                                        <span class="plan-interval-price">19,90€<small>/mês + IVA</small></span>
                                    </button>

                                    <button
                                        class="plan-interval-option"
                                        :class="{ selected: billingInterval === 'year' }"
                                        type="button"
                                        @click="billingInterval = 'year'"
                                    >
                                        <span class="plan-interval-badge">Poupa 20%</span>
                                        <span class="plan-interval-name">Anual</span>
                                        <span class="plan-interval-price">191,04€<small>/ano + IVA</small></span>
                                    </button>
                                </div>

                                <div class="form-actions">
                                    <button
                                        class="btn btn-accent"
                                        type="button"
                                        :disabled="isRedirecting"
                                        @click="startCheckout(billingInterval)"
                                    >
                                        {{ isRedirecting ? 'A abrir pagamento...' : 'Atualizar para o Pro' }}
                                    </button>
                                </div>
                            </template>
                        </div>
                    </article>
                </div>

                <div v-show="activeTab === 'seguranca'" class="panel">
                    <article class="card form-card security-card">
                        <div class="section-head">
                            <div>
                                <p class="section-label">Seguranca</p>
                                <h2>Alterar password</h2>
                            </div>
                        </div>

                        <form class="form" @submit.prevent="savePassword">
                            <div>
                                <label class="label">Password atual</label>
                                <input v-model="passwordForm.current_password" class="input" type="password" placeholder="********" />
                            </div>

                            <div class="two-columns">
                                <div>
                                    <label class="label">Nova password</label>
                                    <input v-model="passwordForm.new_password" class="input" type="password" placeholder="Minimo 6 caracteres" />
                                </div>

                                <div>
                                    <label class="label">Confirmar nova password</label>
                                    <input v-model="passwordForm.new_password_confirm" class="input" type="password" placeholder="Repete a nova password" />
                                </div>
                            </div>

                            <p class="security-hint">
                                So e alterada se preencheres os tres campos acima.
                            </p>

                            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
                            <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

                            <div class="form-actions">
                                <button class="btn btn-secondary" type="submit" :disabled="isSavingPassword">
                                    {{ isSavingPassword ? 'A atualizar...' : 'Atualizar password' }}
                                </button>
                            </div>
                        </form>
                    </article>
                </div>
            </template>
        </section>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: ['auth'],
    layout: 'backoffice',
})

const MAX_PROFILE_PHOTOS = 5

type MeResponse = {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    is_staff: boolean
    is_superuser: boolean
    has_usable_password: boolean
}

type StaffProfilePhoto = {
    id: number
    url: string
    position: number
}

type StaffSelfProfileResponse = {
    id: number
    uuid: string
    business: number
    business_uuid: string
    business_name: string
    name: string
    bio: string
    avatar_url: string
    gallery_image_urls: string[]
    photos: StaffProfilePhoto[]
    updated_at: string
}

type ExistingProfessionalPhoto = {
    id: number
    url: string
    isNew: false
}

type NewProfessionalPhoto = {
    id: string
    url: string
    file: File
    isNew: true
}

type ProfessionalPhoto = ExistingProfessionalPhoto | NewProfessionalPhoto

const { apiFetch } = useApi()
const { currentBusiness, currentUser, loadCurrentBusiness } = useCurrentBusiness()
const { isFree, isPro } = usePlan()
const { isRedirecting, billingError, startCheckout, openBillingPortal } = useBilling()
const billingInterval = ref<'month' | 'year'>('month')
const route = useRoute()

const isLoadingProfile = ref(false)
const isSavingProfile = ref(false)
const isSavingPassword = ref(false)
const isSavingProfessionalProfile = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const professionalProfileState = ref<'hidden' | 'missing' | 'ready'>('hidden')
const profilePhoto = ref<ProfessionalPhoto | null>(null)
const galleryPhotos = ref<ProfessionalPhoto[]>([])
const profilePhotoInputRef = ref<HTMLInputElement | null>(null)
const galleryInputRef = ref<HTMLInputElement | null>(null)
const maxGalleryPhotos = MAX_PROFILE_PHOTOS - 1

const form = reactive({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
})

const professionalForm = reactive({
    bio: '',
})

const passwordForm = reactive({
    current_password: '',
    new_password: '',
    new_password_confirm: '',
})

const hasUsablePassword = ref(true)

const fullName = computed(() => {
    const name = `${form.first_name} ${form.last_name}`.trim()
    return name || form.username || 'Utilizador'
})

const userInitials = computed(() => {
    const tokens = fullName.value.split(/\s+/).filter(Boolean)

    if (!tokens.length) {
        return 'TF'
    }

    return tokens
        .slice(0, 2)
        .map((token) => token.charAt(0).toUpperCase())
        .join('')
})

type AccountTab = 'perfil' | 'negocio' | 'publico' | 'plano' | 'seguranca'

const activeTab = ref<AccountTab>('perfil')

const canManageBusiness = computed(() => {
    const role = currentBusiness.value?.role
    return role === 'owner' || role === 'manager'
})

const tabs = computed(() => {
    const list: { key: AccountTab; label: string }[] = [{ key: 'perfil', label: 'Perfil' }]

    if (canManageBusiness.value) {
        list.push({ key: 'negocio', label: 'Negócio' })
    }

    if (professionalProfileState.value !== 'hidden') {
        list.push({ key: 'publico', label: 'Perfil público' })
    }

    if (canManageBusiness.value) {
        list.push({ key: 'plano', label: 'Plano' })
    }

    if (hasUsablePassword.value) {
        list.push({ key: 'seguranca', label: 'Segurança' })
    }

    return list
})

const accountUserSub = computed(() =>
    [currentBusiness.value?.business_name, form.email].filter(Boolean).join(' · ') || 'Sem negócio'
)

const resetMessages = () => {
    errorMessage.value = ''
    successMessage.value = ''
}

const setTab = (key: AccountTab) => {
    activeTab.value = key
    resetMessages()
}

const resetPasswordForm = () => {
    passwordForm.current_password = ''
    passwordForm.new_password = ''
    passwordForm.new_password_confirm = ''
}

const revokeNewPhotoUrls = (photos: ProfessionalPhoto[]) => {
    for (const photo of photos) {
        if (photo.isNew) {
            URL.revokeObjectURL(photo.url)
        }
    }
}

const applyProfile = (profile: MeResponse | null) => {
    form.username = profile?.username || ''
    form.email = profile?.email || ''
    form.first_name = profile?.first_name || ''
    form.last_name = profile?.last_name || ''
    hasUsablePassword.value = profile?.has_usable_password !== false
}

const applyProfessionalProfile = (profile: StaffSelfProfileResponse | null) => {
    professionalForm.bio = profile?.bio || ''

    if (profilePhoto.value?.isNew) {
        URL.revokeObjectURL(profilePhoto.value.url)
    }
    revokeNewPhotoUrls(galleryPhotos.value)

    const photos: ProfessionalPhoto[] = (profile?.photos || []).map((photo) => ({
        id: photo.id,
        url: photo.url,
        isNew: false,
    }))

    // The first photo (position 0) is the profile photo; the rest is the gallery.
    profilePhoto.value = photos[0] || null
    galleryPhotos.value = photos.slice(1)
}

const triggerProfilePhotoPicker = () => {
    profilePhotoInputRef.value?.click()
}

const handleProfilePhotoInput = (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = (input.files || [])[0]
    input.value = ''

    if (!file) {
        return
    }

    if (profilePhoto.value?.isNew) {
        URL.revokeObjectURL(profilePhoto.value.url)
    }

    profilePhoto.value = {
        id: `new-profile-${Date.now()}`,
        url: URL.createObjectURL(file),
        file,
        isNew: true,
    }
}

const removeProfilePhoto = () => {
    if (profilePhoto.value?.isNew) {
        URL.revokeObjectURL(profilePhoto.value.url)
    }

    profilePhoto.value = null
}

const triggerGalleryPicker = () => {
    galleryInputRef.value?.click()
}

const handleGalleryInput = (event: Event) => {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files || [])
    input.value = ''

    if (!files.length) {
        return
    }

    const remainingSlots = maxGalleryPhotos - galleryPhotos.value.length

    if (remainingSlots <= 0) {
        errorMessage.value = `Podes ter no maximo ${maxGalleryPhotos} fotos na pagina.`
        return
    }

    if (files.length > remainingSlots) {
        errorMessage.value = `So podes adicionar mais ${remainingSlots} foto(s).`
    }

    const acceptedFiles = files.slice(0, remainingSlots)

    galleryPhotos.value = [
        ...galleryPhotos.value,
        ...acceptedFiles.map((file, index) => ({
            id: `new-${Date.now()}-${index}`,
            url: URL.createObjectURL(file),
            file,
            isNew: true as const,
        })),
    ]
}

const removeGalleryPhoto = (photoId: string | number) => {
    const photoIndex = galleryPhotos.value.findIndex((photo) => photo.id === photoId)

    if (photoIndex === -1) {
        return
    }

    const [photo] = galleryPhotos.value.splice(photoIndex, 1)

    if (photo?.isNew) {
        URL.revokeObjectURL(photo.url)
    }
}

const loadProfessionalProfile = async () => {
    if (!currentBusiness.value?.business_uuid) {
        professionalProfileState.value = 'hidden'
        applyProfessionalProfile(null)
        return
    }

    try {
        const response = await apiFetch<StaffSelfProfileResponse>(
            `/staff/me-profile/?business_uuid=${encodeURIComponent(currentBusiness.value.business_uuid)}`
        )
        applyProfessionalProfile(response)
        professionalProfileState.value = 'ready'
    } catch (error: any) {
        if (error?.status === 404 || error?.statusCode === 404) {
            professionalProfileState.value = 'missing'
            applyProfessionalProfile(null)
            return
        }

        throw error
    }
}

/* ---------------- Perfil do negócio (dono / gestor) ---------------- */

const MAX_BUSINESS_PHOTOS = 12
const maxBusinessGallery = MAX_BUSINESS_PHOTOS - 1

const businessProfileState = ref<'hidden' | 'ready'>('hidden')
const isSavingBusiness = ref(false)
const newCategory = ref('')
const businessCover = ref<ProfessionalPhoto | null>(null)
const businessGallery = ref<ProfessionalPhoto[]>([])
const businessCoverInputRef = ref<HTMLInputElement | null>(null)
const businessGalleryInputRef = ref<HTMLInputElement | null>(null)

const businessForm = reactive({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    instagram_url: '',
    website_url: '',
    categories: [] as string[],
    is_public: true,
})

const applyBusinessProfile = (data: any) => {
    businessForm.name = data?.name || ''
    businessForm.description = data?.description || ''
    businessForm.email = data?.email || ''
    businessForm.phone = data?.phone || ''
    businessForm.address = data?.address || ''
    businessForm.city = data?.city || ''
    businessForm.instagram_url = data?.instagram_url || ''
    businessForm.website_url = data?.website_url || ''
    businessForm.categories = Array.isArray(data?.categories) ? [...data.categories] : []
    businessForm.is_public = data?.is_public !== false

    if (businessCover.value?.isNew) {
        URL.revokeObjectURL(businessCover.value.url)
    }
    revokeNewPhotoUrls(businessGallery.value)

    const photos: ProfessionalPhoto[] = (data?.photos || []).map((photo: StaffProfilePhoto) => ({
        id: photo.id,
        url: photo.url,
        isNew: false,
    }))

    // The first photo (position 0) is the cover; the rest is the gallery.
    businessCover.value = photos[0] || null
    businessGallery.value = photos.slice(1)
}

const loadBusinessProfile = async () => {
    if (!canManageBusiness.value || !currentBusiness.value?.business_uuid) {
        businessProfileState.value = 'hidden'
        return
    }

    try {
        const response = await apiFetch<any>(
            `/businesses/me-business/?business_uuid=${encodeURIComponent(currentBusiness.value.business_uuid)}`
        )
        applyBusinessProfile(response)
        businessProfileState.value = 'ready'
    } catch (error) {
        console.error(error)
        businessProfileState.value = 'hidden'
    }
}

const addCategory = () => {
    const value = newCategory.value.trim()

    if (value && !businessForm.categories.includes(value)) {
        businessForm.categories.push(value)
    }

    newCategory.value = ''
}

const removeCategory = (value: string) => {
    businessForm.categories = businessForm.categories.filter((category) => category !== value)
}

const triggerBusinessCoverPicker = () => {
    businessCoverInputRef.value?.click()
}

const handleBusinessCoverInput = (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = (input.files || [])[0]
    input.value = ''

    if (!file) {
        return
    }

    if (businessCover.value?.isNew) {
        URL.revokeObjectURL(businessCover.value.url)
    }

    businessCover.value = {
        id: `new-cover-${Date.now()}`,
        url: URL.createObjectURL(file),
        file,
        isNew: true,
    }
}

const removeBusinessCover = () => {
    if (businessCover.value?.isNew) {
        URL.revokeObjectURL(businessCover.value.url)
    }

    businessCover.value = null
}

const triggerBusinessGalleryPicker = () => {
    businessGalleryInputRef.value?.click()
}

const handleBusinessGalleryInput = (event: Event) => {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files || [])
    input.value = ''

    if (!files.length) {
        return
    }

    const remaining = maxBusinessGallery - businessGallery.value.length

    if (remaining <= 0) {
        errorMessage.value = `Podes ter no maximo ${maxBusinessGallery} fotos na galeria.`
        return
    }

    if (files.length > remaining) {
        errorMessage.value = `So podes adicionar mais ${remaining} foto(s).`
    }

    businessGallery.value = [
        ...businessGallery.value,
        ...files.slice(0, remaining).map((file, index) => ({
            id: `newb-${Date.now()}-${index}`,
            url: URL.createObjectURL(file),
            file,
            isNew: true as const,
        })),
    ]
}

const removeBusinessGalleryPhoto = (photoId: string | number) => {
    const index = businessGallery.value.findIndex((photo) => photo.id === photoId)

    if (index === -1) {
        return
    }

    const [photo] = businessGallery.value.splice(index, 1)

    if (photo?.isNew) {
        URL.revokeObjectURL(photo.url)
    }
}

const saveBusinessProfile = async () => {
    resetMessages()

    if (!currentBusiness.value?.business_uuid) {
        errorMessage.value = 'Nao existe negocio atual selecionado.'
        return
    }

    const orderedPhotos = [
        ...(businessCover.value ? [businessCover.value] : []),
        ...businessGallery.value,
    ]

    if (orderedPhotos.length > MAX_BUSINESS_PHOTOS) {
        errorMessage.value = `Podes ter no maximo ${MAX_BUSINESS_PHOTOS} fotos no negocio.`
        return
    }

    try {
        isSavingBusiness.value = true

        const formData = new FormData()
        formData.append('name', businessForm.name.trim())
        formData.append('description', businessForm.description.trim())
        formData.append('email', businessForm.email.trim())
        formData.append('phone', businessForm.phone.trim())
        formData.append('address', businessForm.address.trim())
        formData.append('city', businessForm.city.trim())
        formData.append('instagram_url', businessForm.instagram_url.trim())
        formData.append('website_url', businessForm.website_url.trim())
        formData.append('is_public', businessForm.is_public ? 'true' : 'false')

        for (const category of businessForm.categories) {
            formData.append('categories', category)
        }

        for (const photo of orderedPhotos) {
            if (photo.isNew) {
                formData.append('photos_order', 'new')
                formData.append('photos', photo.file)
            } else {
                formData.append('photos_order', String(photo.id))
            }
        }

        const response = await apiFetch<any>(
            `/businesses/me-business/?business_uuid=${encodeURIComponent(currentBusiness.value.business_uuid)}`,
            {
                method: 'PATCH',
                body: formData,
            }
        )

        applyBusinessProfile(response)
        successMessage.value = 'Negocio atualizado com sucesso.'
    } catch (error: any) {
        console.error(error)
        errorMessage.value = formatApiError(error)
    } finally {
        isSavingBusiness.value = false
    }
}

const loadProfile = async () => {
    try {
        isLoadingProfile.value = true
        resetMessages()

        await loadCurrentBusiness({ force: true })
        applyProfile(currentUser.value as MeResponse | null)
        await loadProfessionalProfile()
        await loadBusinessProfile()
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Nao foi possivel carregar o perfil.'
    } finally {
        isLoadingProfile.value = false
    }
}

const formatApiError = (error: any) => {
    const data = error?.data

    if (!data) {
        return 'Ocorreu um erro inesperado.'
    }

    if (typeof data === 'string') {
        return data
    }

    const firstEntry = Object.entries(data)[0]

    if (!firstEntry) {
        return 'Ocorreu um erro inesperado.'
    }

    const [, value] = firstEntry

    if (Array.isArray(value)) {
        return String(value[0])
    }

    return String(value)
}

const refreshSessionProfile = async () => {
    await loadCurrentBusiness({ force: true })
    applyProfile(currentUser.value as MeResponse | null)
}

const saveProfile = async () => {
    resetMessages()

    if (!form.username.trim()) {
        errorMessage.value = 'O username e obrigatorio.'
        return
    }

    try {
        isSavingProfile.value = true

        await apiFetch('/me/', {
            method: 'PATCH',
            body: {
                username: form.username.trim(),
                email: form.email.trim(),
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
            },
        })

        await refreshSessionProfile()
        successMessage.value = 'Perfil atualizado com sucesso.'
    } catch (error: any) {
        console.error(error)
        errorMessage.value = formatApiError(error)
    } finally {
        isSavingProfile.value = false
    }
}

const savePassword = async () => {
    resetMessages()

    if (
        !passwordForm.current_password
        || !passwordForm.new_password
        || !passwordForm.new_password_confirm
    ) {
        errorMessage.value = 'Preenche a password atual e a nova password.'
        return
    }

    try {
        isSavingPassword.value = true

        await apiFetch('/me/', {
            method: 'PATCH',
            body: {
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password,
                new_password_confirm: passwordForm.new_password_confirm,
            },
        })

        resetPasswordForm()
        successMessage.value = 'Password atualizada com sucesso.'
    } catch (error: any) {
        console.error(error)
        errorMessage.value = formatApiError(error)
    } finally {
        isSavingPassword.value = false
    }
}

const saveProfessionalProfile = async () => {
    resetMessages()

    if (!currentBusiness.value?.business_uuid) {
        errorMessage.value = 'Nao existe negocio atual selecionado.'
        return
    }

    // Profile photo first (position 0 = primary), then the gallery photos.
    const orderedPhotos = [
        ...(profilePhoto.value ? [profilePhoto.value] : []),
        ...galleryPhotos.value,
    ]

    if (orderedPhotos.length > MAX_PROFILE_PHOTOS) {
        errorMessage.value = `Podes ter no maximo ${MAX_PROFILE_PHOTOS} fotos no perfil.`
        return
    }

    try {
        isSavingProfessionalProfile.value = true

        const formData = new FormData()
        formData.append('bio', professionalForm.bio.trim())

        for (const photo of orderedPhotos) {
            if (photo.isNew) {
                formData.append('photos_order', 'new')
                formData.append('photos', photo.file)
            } else {
                formData.append('photos_order', String(photo.id))
            }
        }

        const response = await apiFetch<StaffSelfProfileResponse>(
            `/staff/me-profile/?business_uuid=${encodeURIComponent(currentBusiness.value.business_uuid)}`,
            {
                method: 'PATCH',
                body: formData,
            }
        )

        applyProfessionalProfile(response)
        professionalProfileState.value = 'ready'
        successMessage.value = 'Pagina publica atualizada com sucesso.'
    } catch (error: any) {
        console.error(error)
        errorMessage.value = formatApiError(error)
    } finally {
        isSavingProfessionalProfile.value = false
    }
}

onBeforeUnmount(() => {
    if (profilePhoto.value?.isNew) {
        URL.revokeObjectURL(profilePhoto.value.url)
    }
    revokeNewPhotoUrls(galleryPhotos.value)

    if (businessCover.value?.isNew) {
        URL.revokeObjectURL(businessCover.value.url)
    }
    revokeNewPhotoUrls(businessGallery.value)
})

const billingStatusMessage = ref('')

onMounted(() => {
    loadProfile()

    const tabQuery = route.query.tab
    if (tabQuery === 'plano') {
        activeTab.value = 'plano'
    }

    if (route.query.billing === 'success') {
        billingStatusMessage.value = 'Pagamento confirmado! A atualizar o teu plano...'
        loadCurrentBusiness({ force: true }).then(() => {
            billingStatusMessage.value = currentBusiness.value?.business_plan === 'pro'
                ? 'O teu plano Pro já está ativo.'
                : 'Pagamento recebido - o plano pode demorar alguns segundos a atualizar.'
        })
    } else if (route.query.billing === 'cancelled') {
        billingStatusMessage.value = 'Pagamento não foi concluído. Podes tentar novamente quando quiseres.'
    }
})
</script>

<style scoped>
.account-page {
    padding: 42px 0 96px;
}

.account-head {
    margin-bottom: 20px;
}

.account-head h1 {
    margin: 0;
    font-size: clamp(34px, 6vw, 48px);
    line-height: 0.92;
    letter-spacing: -0.05em;
}

/* user row */
.account-user {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    margin-bottom: 18px;
}

.account-user-avatar {
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    flex-shrink: 0;
    border-radius: 18px;
    background: var(--tf-black);
    color: var(--tf-accent);
    font-size: 20px;
    font-weight: 900;
    letter-spacing: -0.03em;
}

.account-user-copy {
    min-width: 0;
}

.account-user-name {
    font-size: 17px;
    font-weight: 800;
    letter-spacing: -0.02em;
}

.account-user-sub {
    margin-top: 3px;
    color: var(--tf-muted);
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* tabs */
.tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
}

.tab {
    padding: 10px 18px;
    border: 0;
    border-radius: 999px;
    background: #f1ecdf;
    color: #6b6b60;
    font-family: var(--tf-sans);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
}

.tab:hover {
    color: var(--tf-black);
}

.tab.active {
    background: var(--tf-black);
    color: var(--tf-accent);
}

/* panels */
.panel {
    display: grid;
    gap: 16px;
    max-width: 760px;
}

.form-card,
.state-card {
    padding: 22px;
}

.section-label {
    margin: 0 0 10px;
    font-family: var(--tf-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.section-head {
    margin-bottom: 18px;
}

.section-head h2 {
    margin: 0;
    font-size: 24px;
    letter-spacing: -0.045em;
}

.form {
    display: grid;
    gap: 18px;
}

.two-columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 14px;
}

.form-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.security-card {
    background:
        linear-gradient(180deg, rgba(215, 255, 62, 0.18), rgba(215, 255, 62, 0) 120px),
        var(--tf-white);
}

.plan-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    margin-top: 8px;
    padding: 24px;
    border: 1px solid var(--tf-border);
    border-radius: 16px;
    background: var(--tf-cream, #f6f2e9);
}

.plan-card-pro {
    background: rgba(215, 255, 62, 0.14);
    border-color: rgba(215, 255, 62, 0.4);
}

.plan-card-tag {
    display: inline-flex;
    align-items: center;
    padding: 5px 14px;
    border-radius: 999px;
    background: var(--tf-black);
    color: var(--tf-accent);
    font-family: var(--tf-mono);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
}

.plan-card-title {
    margin: 0;
    font-size: 17px;
    font-weight: 800;
    color: var(--tf-ink);
}

.plan-card-copy {
    margin: 0;
    color: var(--tf-muted);
    font-size: 14px;
    line-height: 1.5;
}

.plan-interval-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 100%;
    margin-top: 6px;
}

.plan-interval-option {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px 18px;
    border: 2px solid var(--tf-border);
    border-radius: 14px;
    background: var(--tf-white);
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;
}

.plan-interval-option.selected {
    border-color: var(--tf-ink);
    background: rgba(215, 255, 62, 0.16);
}

.plan-interval-badge {
    position: absolute;
    top: -10px;
    right: 14px;
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--tf-black);
    color: var(--tf-accent);
    font-family: var(--tf-mono);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
}

.plan-interval-name {
    font-size: 13px;
    font-weight: 700;
    color: var(--tf-muted);
}

.plan-interval-price {
    font-size: 20px;
    font-weight: 800;
    color: var(--tf-ink);
}

.plan-interval-price small {
    font-size: 12px;
    font-weight: 600;
    color: var(--tf-muted);
}

.professional-card {
    grid-column: 1 / -1;
}

.security-hint,
.photo-help {
    margin: 0;
    color: var(--tf-muted);
    font-size: 13px;
    font-weight: 700;
}

.textarea {
    min-height: 120px;
    padding-top: 14px;
    resize: vertical;
}

.state-card {
    border-radius: 18px;
    color: var(--tf-muted);
    font-weight: 700;
}

.inline-state-card {
    padding: 0;
    border: 0;
    background: transparent;
}

.photo-block {
    display: grid;
    gap: 14px;
}

.photo-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 16px;
}

.profile-photo-slot {
    display: flex;
    align-items: center;
    gap: 16px;
}

.profile-photo-slot img {
    width: 96px;
    height: 96px;
    border-radius: 24px;
    object-fit: cover;
    border: 1px solid var(--tf-border);
}

.photo-add {
    flex-shrink: 0;
}

.photo-input {
    display: none;
}

.photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
}

.photo-card {
    overflow: hidden;
    border: 1px solid var(--tf-border);
    border-radius: 18px;
    background: #faf7ef;
}

.photo-card img {
    display: block;
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
}

.photo-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 12px;
}

.photo-badge {
    font-family: var(--tf-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.photo-remove {
    border: 0;
    background: transparent;
    color: #991b1b;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
}

.empty-photo-state {
    margin: 0;
    padding: 18px;
    border: 1px dashed var(--tf-border);
    border-radius: 16px;
    color: var(--tf-muted);
    font-weight: 700;
}

/* ---- business: cover, categories, visibility toggle ---- */
.cover-slot {
    display: grid;
    gap: 10px;
}

.cover-slot img {
    width: 100%;
    height: 150px;
    border-radius: 16px;
    object-fit: cover;
    border: 1px solid var(--tf-border);
}

.cover-slot .photo-remove {
    justify-self: start;
}

.cat-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
}

.cat-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 999px;
    background: var(--tf-black);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
}

.cat-chip button {
    border: 0;
    background: transparent;
    color: var(--tf-accent);
    font-size: 15px;
    line-height: 1;
    cursor: pointer;
}

.cat-input-row {
    display: flex;
    gap: 10px;
}

.cat-input-row .input {
    flex: 1;
}

.cat-input-row .btn {
    flex-shrink: 0;
}

.switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-top: 16px;
    border-top: 1px solid #eee8da;
}

.switch-row strong {
    display: block;
    font-size: 14px;
}

.switch-hint {
    display: block;
    margin-top: 3px;
    color: var(--tf-muted);
    font-size: 12px;
    font-weight: 600;
}

.switch {
    appearance: none;
    -webkit-appearance: none;
    flex-shrink: 0;
    width: 46px;
    height: 26px;
    border-radius: 999px;
    background: #e0dbcf;
    position: relative;
    cursor: pointer;
    transition: background 0.15s ease;
}

.switch:checked {
    background: var(--tf-black);
}

.switch::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    transition: left 0.15s ease, background 0.15s ease;
}

.switch:checked::after {
    left: 23px;
    background: var(--tf-accent);
}

.error-message {
    margin: 0;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tf-danger-bg);
    color: var(--tf-danger-fg);
    font-weight: 700;
}

.success-message {
    margin: 0;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tf-success-bg);
    color: var(--tf-success-fg);
    font-weight: 700;
}

@media (max-width: 820px) {
    .account-page {
        padding: 24px 0 96px;
    }

    .two-columns,
    .photo-head {
        grid-template-columns: 1fr;
    }

    .photo-head {
        display: grid;
    }
}
</style>
