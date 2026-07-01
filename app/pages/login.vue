<template>
    <div class="page login-page">
        <div class="login-card card">
            <p class="tf-eyebrow">TF Booking</p>

            <h1>Entrar</h1>

            <p class="subtitle">
                Acede ao painel de gestão das tuas marcações.
            </p>

            <form class="form">
                <div>
                    <label class="label">Username</label>
                    <input class="input" type="text" placeholder="admin" />
                </div>

                <div>
                    <label class="label">Password</label>
                    <input class="input" type="password" placeholder="••••••••" />
                </div>

                <button class="btn btn-accent" type="button">
                    Entrar
                </button>
            </form>
        </div>
    </div>
</template>

<style scoped>
.login-page {
    display: grid;
    place-items: center;
    padding: 56px 16px;
}

.login-card {
    width: min(440px, 100%);
    padding: 34px;
}

h1 {
    margin: 0;
    font-size: 44px;
    line-height: 0.95;
    letter-spacing: -0.06em;
}

.subtitle {
    margin: 14px 0 28px;
    color: var(--tf-muted);
    line-height: 1.5;
}

.form {
    display: grid;
    gap: 18px;
}
</style>