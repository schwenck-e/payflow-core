/**
 * Template Canônico de Testes End-to-End (E2E) com Playwright
 * Padrão: Page Object Model (POM), Mocks de Rede e Assertions Determinísticas
 */

import { test, expect, type Page } from '@playwright/test'

// 1. Page Object Model (POM) para isolamento da interface
export class <MODULE_NAME>Page {
  readonly page: Page
  readonly heading = () => this.page.getByRole('heading', { level: 1 })
  readonly submitButton = () => this.page.getByRole('button', { name: /salvar|criar|confirmar/i })
  readonly toastSuccess = () => this.page.locator('.sonner-toast, [role="alert"]')

  constructor(page: Page) {
    this.page = page
  }

  async goto() {
    await this.page.goto('/<ROUTE_PATH>')
    await expect(this.heading()).toBeVisible()
  }

  async fillForm(data: Record<string, string>) {
    for (const [key, value] of Object.entries(data)) {
      const input = this.page.getByLabel(new RegExp(key, 'i'))
      await expect(input).toBeVisible()
      await input.fill(value)
    }
  }

  async submit() {
    await this.submitButton().click()
  }
}

// 2. Suíte de Testes Automatizada
test.describe('<MODULE_NAME> - Fluxos Críticos de Negócio (E2E)', () => {
  let modulePage: <MODULE_NAME>Page

  test.beforeEach(async ({ page }) => {
    // Configura autenticação mockada ou token JWT na sessão
    await page.addInitScript(() => {
      window.localStorage.setItem('auth_token', 'mocked_jwt_token_for_e2e_testing')
    })

    modulePage = new <MODULE_NAME>Page(page)
  })

  test('Cenário 1: Criar novo registro com sucesso (Happy Path)', async ({ page }) => {
    // Intercepta e valida a chamada de API no backend
    await page.route('**/api/v1/<ROUTE_PATH>', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'mock_id_01',
            status: 'SUCCESS',
            message: 'Registro criado com sucesso'
          })
        })
      } else {
        await route.continue()
      }
    })

    await modulePage.goto()
    await modulePage.fillForm({
      nome: 'Registro de Teste E2E',
      descricao: 'Validação automatizada de ponta a ponta'
    })
    await modulePage.submit()

    // Assertions determinísticas sem timers arbitrários
    await expect(modulePage.toastSuccess()).toContainText(/sucesso|criado/i)
  })

  test('Cenário 2: Validação de campo obrigatório e feedback de erro', async ({ page }) => {
    await modulePage.goto()
    await modulePage.submit()

    // Valida que a validação de frontend impediu a submissão
    const errorMessage = page.locator('text=/campo obrigatório|inválido/i')
    await expect(errorMessage.first()).toBeVisible()
  })
})
