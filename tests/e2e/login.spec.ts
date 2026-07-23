import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = "admin@misistema.local";
const ADMIN_PASSWORD = "cambiar123";

test.describe("Flujo de ingreso", () => {
  test("landing carga con la marca y CTA de ingreso", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Mi Sistema/);
    await expect(
      page.getByRole("heading", { name: "Mi Sistema" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();
  });

  test("/inicio redirige a /ingresar si no hay sesión", async ({ page }) => {
    const response = await page.goto("/inicio");
    expect(response?.url()).toContain("/ingresar");
  });

  test("ingresa con credenciales correctas y muestra dashboard", async ({
    page,
  }) => {
    await page.goto("/ingresar");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Ingresar" }).click();

    await page.waitForURL("**/inicio", { timeout: 30_000 });

    await expect(page.getByText(/Hola,/)).toBeVisible();
    await expect(page.getByText("Clientes activos")).toBeVisible();
    await expect(page.getByText("Etiquetas activas")).toBeVisible();
  });

  test("rechaza credenciales incorrectas con mensaje claro", async ({
    page,
  }) => {
    await page.goto("/ingresar");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Contraseña").fill("password-incorrecto");
    await page.getByRole("button", { name: "Ingresar" }).click();

    await expect(
      page.getByText(/Email o contraseña incorrectos/),
    ).toBeVisible();
    expect(page.url()).toContain("/ingresar");
  });

  test("valida formato de email en el formulario", async ({ page }) => {
    await page.goto("/ingresar");
    await page.getByLabel("Email").fill("no-es-un-email");
    await page.getByLabel("Contraseña").fill("algo");
    await page.getByRole("button", { name: "Ingresar" }).click();

    await expect(page.getByText(/Ingresá un email válido/)).toBeVisible();
    expect(page.url()).toContain("/ingresar");
  });
});
