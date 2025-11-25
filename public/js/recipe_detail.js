// ============================================
// recipe_detail.js - 레시피 상세 페이지 백엔드 연동
// ============================================

function renderRecipeDetail(recipe) {
    if (!recipe) {
        document.querySelector('.recipe-detail-container').innerHTML = '<p style="text-align: center; font-size: 1.5rem; color:#cc0000; margin: 4rem 0;">레시피 정보를 찾을 수 없습니다.</p>';
        return;
    }

    document.title = `${recipe.name} | 맛있는 코드`;
    document.getElementById('recipeMainImage').src = recipe.image_url || '';
    document.getElementById('recipeMainImage').alt = recipe.name;
    document.getElementById('recipeTitle').textContent = recipe.name;
    document.getElementById('recipeDesc').textContent = recipe.description || '';
    document.getElementById('recipeTime').textContent = recipe.time || '';
    document.getElementById('recipeCategory').textContent = recipe.category || '';

    const ingredientsContainer = document.getElementById('ingredientsContainer');
    ingredientsContainer.innerHTML = '';
    if (recipe.ingredients && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach(item => {
            const ingredientItem = document.createElement('div');
            ingredientItem.className = 'ingredient-item';

            const amount = [item.amount, item.unit].filter(Boolean).join(' ');

            ingredientItem.innerHTML = `
                <div class="ingredient-info">
                    <span class="ingredient-name">${item.ingredient}</span>
                    <span class="ingredient-amount">${amount}</span>
                </div>
            `;
            ingredientsContainer.appendChild(ingredientItem);
        });
    } else {
        ingredientsContainer.innerHTML = '<p>재료 정보가 없습니다.</p>';
    }

    const stepsContainer = document.getElementById('recipeStepsList');
    if (stepsContainer) {
        stepsContainer.innerHTML = '';

        if (recipe.steps && recipe.steps.length > 0) {
            recipe.steps.forEach((step, index) => {
                const order = step.step_order ?? index + 1;
                const stepItem = document.createElement('div');
                stepItem.className = 'recipe-step-item';

                const stepContent = document.createElement('div');
                stepContent.className = 'step-content';

                const stepNumber = document.createElement('div');
                stepNumber.className = 'step-number';
                stepNumber.textContent = order;

                const stepTitle = document.createElement('h3');
                stepTitle.className = 'step-title';
                stepTitle.textContent = `단계 ${order}`;

                const stepDescription = document.createElement('p');
                stepDescription.className = 'step-description';
                stepDescription.textContent = step.step_description;

                stepContent.appendChild(stepNumber);
                stepContent.appendChild(stepTitle);
                stepContent.appendChild(stepDescription);

                stepItem.appendChild(stepContent);

                stepsContainer.appendChild(stepItem);
            });
        } else {
            stepsContainer.innerHTML = '<p>조리 단계 정보가 없습니다.</p>';
        }
    }
}

async function loadRecipeDetail() {
    const params = new URLSearchParams(window.location.search);
    const recipeId = params.get('id');
    const status = document.getElementById('recipeDetailStatus');

    if (!recipeId) {
        if (status) status.textContent = '레시피 ID가 제공되지 않았습니다.';
        return;
    }

    try {
        if (status) status.textContent = '레시피를 불러오는 중입니다...';
        const response = await window.apiClient.fetchRecipeDetail(recipeId);
        renderRecipeDetail(response.recipe);
        if (status) status.textContent = '';
    } catch (err) {
        console.error(err);
        if (status) status.textContent = '레시피 정보를 불러오지 못했습니다.';
    }
}

function setupBackButton() {
    const backButton = document.getElementById('backButton');

    if (backButton) {
        backButton.addEventListener('click', () => {
            if (document.referrer) {
                window.history.back();
            } else {
                window.location.href = '/recipe_all.html';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupBackButton();
    loadRecipeDetail();
});
