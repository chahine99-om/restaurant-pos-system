/**
 * Seed: roles, users (dummy passwords), ingredients, recipes, products, stock.
 * NEVER use real passwords or secrets in seed data.
 */
import { RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    create: { name: RoleName.ADMIN },
    update: {},
  });
  const cashierRole = await prisma.role.upsert({
    where: { name: RoleName.CASHIER },
    create: { name: RoleName.CASHIER },
    update: {},
  });

  const hash = await bcrypt.hash('Password123!', 10);
  const now = new Date();
  await prisma.user.upsert({
    where: { email: 'admin@restaurant.local' },
    create: {
      email: 'admin@restaurant.local',
      password: hash,
      fullName: 'Admin',
      roleId: adminRole.id,
      emailVerifiedAt: now,
    },
    update: { password: hash, emailVerifiedAt: now },
  });
  await prisma.user.upsert({
    where: { email: 'cashier@restaurant.local' },
    create: {
      email: 'cashier@restaurant.local',
      password: hash,
      fullName: 'Cashier',
      roleId: cashierRole.id,
      emailVerifiedAt: now,
    },
    update: { password: hash, emailVerifiedAt: now },
  });

  const chicken = await prisma.ingredient.upsert({ where: { name: 'Chicken' }, create: { name: 'Chicken', unit: 'g' }, update: {} });
  const breadcrumbs = await prisma.ingredient.upsert({ where: { name: 'Crispy breadcrumbs' }, create: { name: 'Crispy breadcrumbs', unit: 'g' }, update: {} });
  const spices = await prisma.ingredient.upsert({ where: { name: 'Spices' }, create: { name: 'Spices', unit: 'g' }, update: {} });
  const tomatoes = await prisma.ingredient.upsert({ where: { name: 'Tomatoes' }, create: { name: 'Tomatoes', unit: 'g' }, update: {} });
  const onions = await prisma.ingredient.upsert({ where: { name: 'Onions' }, create: { name: 'Onions', unit: 'g' }, update: {} });

  const ingredients = [chicken, breadcrumbs, spices, tomatoes, onions];
  const stockQtys = [6000, 5000, 5000, 300, 5000];
  for (let i = 0; i < ingredients.length; i++) {
    await prisma.stock.upsert({
      where: { ingredientId: ingredients[i].id },
      create: { ingredientId: ingredients[i].id, quantityGrams: stockQtys[i] },
      update: { quantityGrams: stockQtys[i] },
    });
  }

  // Idempotent: reuse existing "Maxi Crispy" recipe or create
  let recipe = await prisma.recipe.findFirst({ where: { name: 'Maxi Crispy' } });
  if (!recipe) {
    recipe = await prisma.recipe.create({
      data: {
        name: 'Maxi Crispy',
        recipeIngredients: {
          create: [
            { ingredientId: chicken.id, quantityGrams: 300 },
            { ingredientId: breadcrumbs.id, quantityGrams: 10 },
            { ingredientId: spices.id, quantityGrams: 2 },
            { ingredientId: tomatoes.id, quantityGrams: 20 },
            { ingredientId: onions.id, quantityGrams: 10 },
          ],
        },
      },
    });
  }

  await prisma.product.upsert({
    where: { recipeId: recipe.id },
    create: { name: 'Maxi Crispy', recipeId: recipe.id, price: 12.5 },
    update: { price: 12.5 },
  });

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
