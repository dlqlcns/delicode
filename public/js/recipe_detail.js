// ============================================
// recipe_detail.js - 레시피 상세 페이지 동적 기능
// ============================================

// 레시피 상세 데이터
const ALL_RECIPES_DETAIL = [
    {
        id: 'kimchi_jjigae',
        title: '김치찌개',
        category: '한식',
        desc: '잘 익은 김치로 끓여 깊은 맛을 낸 한국의 대표 찌개입니다. 돼지고기나 참치를 넣어 더욱 풍부한 맛을 즐길 수 있습니다.',
        ingredients: [
            { name: '김치', amount: '1/4 포기' },
            { name: '돼지고기', amount: '100g' },
            { name: '두부', amount: '1/2 모' },
            { name: '대파', amount: '1/3 대' },
            { name: '다진 마늘', amount: '1/2 큰술' },
            { name: '고춧가루', amount: '1 작은술' },
        ],
        time: '30분',
        imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&h=400&fit=crop',
        steps: [
            { num: 1, title: '재료 준비하기', desc: '필요한 모든 재료를 깨끗이 씻고, 손질하여 준비합니다. 야채는 적당한 크기로 잘라주세요.' },
            { num: 2, title: '야채 손질하기', desc: '준비한 야채를 레시피에 맞게 깨끗이 손질합니다. 야채는 적당한 크기로 잘라 준비해주세요.' },
            { num: 3, title: '조리하기', desc: '중불에서 재료를 볶고 끓여 완성합니다. 양념을 추가하고 골고루 섞어주세요.' }
        ]
    },
    {
        id: 'cream_pasta',
        title: '크림 파스타',
        category: '양식',
        desc: '부드럽고 고소한 크림 소스가 면발과 완벽하게 어우러진 파스타입니다. 베이컨이나 새우를 추가하면 좋습니다.',
        ingredients: [
            { name: '스파게티면', amount: '100g' },
            { name: '생크림', amount: '200ml' },
            { name: '베이컨', amount: '2줄' },
            { name: '양파', amount: '1/4 개' },
            { name: '마늘', amount: '3 쪽' },
            { name: '파마산 치즈', amount: '2 큰술' },
        ],
        time: '20분',
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=400&fit=crop',
        steps: [
            { num: 1, title: '면 삶기', desc: '소금 1 큰술을 넣은 끓는 물에 스파게티면을 넣고 포장지에 적힌 시간만큼 삶아줍니다.' },
            { num: 2, title: '재료 볶기', desc: '팬에 올리브 오일을 두르고 마늘, 양파, 베이컨 순으로 볶아 향을 냅니다.' },
            { num: 3, title: '크림 소스 만들기', desc: '생크림과 면수를 조금 넣고 끓입니다. 파마산 치즈로 간을 맞춥니다.' }
        ]
    },
    {
        id: 'ramen',
        title: '일본식 라멘',
        category: '일식',
        desc: '진한 돈코츠 육수에 탱탱한 면발이 일품인 일본식 라멘입니다.',
        ingredients: [
            { name: '라면', amount: '1개' },
            { name: '돼지고기', amount: '100g' },
            { name: '계란', amount: '1개' },
            { name: '파', amount: '약간' },
            { name: '마늘', amount: '2쪽' },
        ],
        time: '45분',
        imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop',
        steps: [
            { num: 1, title: '육수 만들기', desc: '돼지뼈와 야채를 넣고 오래 끓여 진한 육수를 만듭니다.' },
            { num: 2, title: '면 삶기', desc: '라면을 삶아 준비합니다.' },
            { num: 3, title: '토핑 준비', desc: '계란을 반숙으로 삶고, 파를 썰어 준비합니다.' }
        ]
    },
    {
        id: 'chocolate_cake',
        title: '초콜릿 케이크',
        category: '디저트',
        desc: '촉촉하고 진한 초콜릿 풍미가 가득한 케이크입니다.',
        ingredients: [
            { name: '밀가루', amount: '200g' },
            { name: '설탕', amount: '150g' },
            { name: '코코아가루', amount: '50g' },
            { name: '계란', amount: '3개' },
            { name: '버터', amount: '100g' },
        ],
        time: '60분',
        imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop',
        steps: [
            { num: 1, title: '재료 섞기', desc: '밀가루, 코코아가루, 설탕을 섞습니다.' },
            { num: 2, title: '반죽 만들기', desc: '계란과 버터를 넣고 잘 섞어 반죽을 만듭니다.' },
            { num: 3, title: '굽기', desc: '180도 오븐에서 30분간 굽습니다.' }
        ]
    },
    {
        id: 'grilled_salad',
        title: '그릴 샐러드',
        category: '샐러드',
        desc: '신선한 채소와 건강한 드레싱으로 만든 샐러드입니다.',
        ingredients: [
            { name: '양상추', amount: '100g' },
            { name: '토마토', amount: '2개' },
            { name: '오이', amount: '1개' },
            { name: '올리브오일', amount: '2큰술' },
        ],
        time: '15분',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop',
        steps: [
            { num: 1, title: '채소 씻기', desc: '모든 채소를 깨끗이 씻습니다.' },
            { num: 2, title: '채소 썰기', desc: '채소를 먹기 좋은 크기로 썹니다.' },
            { num: 3, title: '드레싱 뿌리기', desc: '올리브오일과 소금으로 간을 합니다.' }
        ]
    },
    {
        id: 'homemade_pizza',
        title: '수제 피자',
        category: '양식',
        desc: '바삭한 도우 위에 신선한 토핑이 가득한 수제 피자입니다.',
        ingredients: [
            { name: '피자도우', amount: '1개' },
            { name: '토마토소스', amount: '100ml' },
            { name: '모짜렐라치즈', amount: '200g' },
            { name: '페퍼로니', amount: '적당량' },
        ],
        time: '40분',
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop',
        steps: [
            { num: 1, title: '도우 펴기', desc: '피자 도우를 밀대로 펴줍니다.' },
            { num: 2, title: '토핑 올리기', desc: '토마토소스를 바르고 치즈와 토핑을 올립니다.' },
            { num: 3, title: '굽기', desc: '220도 오븐에서 15분간 굽습니다.' }
        ]
    },
    {
        id: 'pu_phat_pong_kari',
        title: '푸팟퐁커리',
        category: '동남아',
        desc: '부드러운 게살과 코코넛 밀크 커리가 조화로운 태국 요리입니다.',
        ingredients: [
            { name: '게', amount: '1마리' },
            { name: '코코넛밀크', amount: '200ml' },
            { name: '커리가루', amount: '2큰술' },
            { name: '양파', amount: '1/2개' },
        ],
        time: '25분',
        imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&h=400&fit=crop',
        steps: [
            { num: 1, title: '게 손질하기', desc: '게를 깨끗이 손질합니다.' },
            { num: 2, title: '커리 만들기', desc: '코코넛밀크와 커리가루를 섞어 끓입니다.' },
            { num: 3, title: '게 볶기', desc: '게와 커리소스를 함께 볶아 완성합니다.' }
        ]
    },
    {
        id: 'pumpkin_soup',
        title: '단호박 수프',
        category: '양식',
        desc: '달콤하고 부드러운 단호박을 갈아 만든 건강 수프입니다.',
        ingredients: [
            { name: '단호박', amount: '1/2개' },
            { name: '우유', amount: '200ml' },
            { name: '양파', amount: '1/4개' },
            { name: '버터', amount: '1큰술' },
        ],
        time: '35분',
        imageUrl: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=600&h=400&fit=crop',
        steps: [
            { num: 1, title: '단호박 찌기', desc: '단호박을 찜기에 넣고 부드럽게 찝니다.' },
            { num: 2, title: '갈기', desc: '단호박과 우유를 믹서기에 갈아줍니다.' },
            { num: 3, title: '끓이기', desc: '냄비에 넣고 약한 불에서 끓여 완성합니다.' }
        ]
    }
];

// ============================================
// 데이터 렌더링 함수
// ============================================

function renderRecipeDetail(recipe) {
    if (!recipe) {
        document.querySelector('.recipe-detail-container').innerHTML = '<p style="text-align: center; font-size: 1.5rem; color: #cc0000; margin: 4rem 0;">레시피 정보를 찾을 수 없습니다.</p>';
        return;
    }
    
    // 페이지 제목 및 기본 정보 설정
    document.title = `${recipe.title} | 맛있는 코드`;
    document.getElementById('recipeMainImage').src = recipe.imageUrl;
    document.getElementById('recipeMainImage').alt = recipe.title;
    document.getElementById('recipeTitle').textContent = recipe.title;
    document.getElementById('recipeDesc').textContent = recipe.desc;
    document.getElementById('recipeTime').textContent = recipe.time;
    document.getElementById('recipeCategory').textContent = recipe.category;
    
    // 1. 재료 목록 렌더링
    const ingredientsContainer = document.getElementById('ingredientsContainer');
    ingredientsContainer.innerHTML = '';
    if (recipe.ingredients && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach(item => {
            const ingredientItem = document.createElement('div');
            ingredientItem.className = 'ingredient-item';
            
            ingredientItem.innerHTML = `
                <div class="ingredient-info">
                    <span class="ingredient-name">${item.name}</span>
                    <span class="ingredient-amount">${item.amount}</span> 
                </div>
            `;
            ingredientsContainer.appendChild(ingredientItem);
        });
    } else {
         ingredientsContainer.innerHTML = '<p style="color: #888; font-size: 14px;">준비된 재료 정보가 없습니다.</p>';
    }

    // 2. 조리 순서 렌더링 (이미지 왼쪽 → 내용 오른쪽)
    const stepsList = document.getElementById('recipeStepsList');
    stepsList.innerHTML = '';
    if (recipe.steps && recipe.steps.length > 0) {
        recipe.steps.forEach(step => {
            const stepItem = document.createElement('div');
            stepItem.className = 'recipe-step-item';
            
            // ✅ 구조: step-image-box + step-content(번호+제목+설명)
            stepItem.innerHTML = `
                <div class="step-image-box" style="background-image: url('${recipe.imageUrl}');"></div>
                <div class="step-content">
                    <div class="step-number">${step.num}</div>
                    <h3 class="step-title">${step.title}</h3>
                    <p class="step-description">${step.desc}</p>
                </div>
            `;
            stepsList.appendChild(stepItem);
        });
    } else {
         stepsList.innerHTML = '<p style="color: #888; text-align: center;">준비된 조리 순서가 없습니다.</p>';
    }
}

// ============================================
// 초기화 및 데이터 로드
// ============================================

function initialize() {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    if (recipeId) {
        const selectedRecipe = ALL_RECIPES_DETAIL.find(r => r.id === recipeId);
        renderRecipeDetail(selectedRecipe);
    } else {
        document.querySelector('.recipe-detail-container').innerHTML = '<p style="text-align: center; font-size: 1.5rem; color: #cc0000; margin: 4rem 0;">레시피 ID가 전달되지 않았습니다.</p>';
        console.error("레시피 ID가 URL에 없습니다.");
    }
}

document.addEventListener('DOMContentLoaded', initialize);