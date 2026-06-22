const BASE_URL = 'http://localhost:3000';

async function runTest() {
    console.log('=== INICIANDO PRUEBAS DE QA INTEGRACIÓN ===');

    const timestamp = Date.now();
    const clientEmail = `client_qa_${timestamp}@example.com`;
    const providerEmail = `provider_qa_${timestamp}@example.com`;
    const password = 'Password123!';

    // Helper to send HTTP requests
    async function request(path, method = 'GET', body = null, token = null) {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const config = {
            method,
            headers,
        };
        if (body) {
            config.body = JSON.stringify(body);
        }
        const res = await fetch(`${BASE_URL}${path}`, config);
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(`HTTP Error ${res.status} on ${method} ${path}: ${JSON.stringify(errBody)}`);
        }
        return res.json();
    }

    try {
        // Step 1: Register Client
        console.log('\n[Paso 1] Registrando usuario Cliente...');
        const clientReg = await request('/auth/register', 'POST', {
            name: 'Cliente QA',
            email: clientEmail,
            password,
            role: 'CLIENT'
        });
        const clientToken = clientReg.access_token;
        const clientId = clientReg.user.id;
        console.log(`Cliente registrado con éxito. ID: ${clientId}, Email: ${clientEmail}`);

        // Step 2: Register Provider
        console.log('\n[Paso 2] Registrando usuario Proveedor...');
        const providerReg = await request('/auth/register', 'POST', {
            name: 'Proveedor QA',
            email: providerEmail,
            password,
            role: 'PROVIDER'
        });
        const providerToken = providerReg.access_token;
        const providerId = providerReg.user.id;
        console.log(`Proveedor registrado con éxito. ID: ${providerId}, Email: ${providerEmail}`);

        // Step 3: Fetch categories
        console.log('\n[Paso 3] Obteniendo categorías disponibles...');
        const categories = await request('/categories');
        if (categories.length === 0) {
            throw new Error('No hay categorías en la base de datos.');
        }
        const category = categories[0];
        console.log(`Categoría seleccionada: ${category.name} (ID: ${category.id})`);

        // Step 4: Update Provider profile with category
        console.log('\n[Paso 4] Actualizando perfil del Proveedor con especialidad...');
        await request('/users/profile', 'PUT', {
            name: 'Proveedor QA',
            phone: '5555-5555',
            categoryId: category.id,
            canTravel: true,
            hasVehicle: true,
            travelDetails: 'Puedo viajar a toda la ciudad'
        }, providerToken);
        console.log('Perfil de Proveedor actualizado correctamente.');

        // Step 5: Client creates Job Post
        console.log('\n[Paso 5] Creando publicación de trabajo desde la sesión del Cliente...');
        const jobPost = await request('/job-posts', 'POST', {
            title: 'Instalacion de Aire Acondicionado QA',
            description: 'Necesito un electricista calificado para instalar un aire acondicionado en mi sala de estar. Trabajo rápido.',
            budget: 350,
            location: 'Guatemala, Zona 15',
            categoryId: category.id
        }, clientToken);
        const jobPostId = jobPost.id;
        console.log(`Publicación creada con éxito. ID: ${jobPostId}, Título: "${jobPost.title}"`);

        // Step 6: Provider sends offer/proposal
        console.log('\n[Paso 6] Enviando propuesta desde la sesión del Proveedor...');
        const offer = await request(`/job-posts/${jobPostId}/offer`, 'POST', {
            price: 320,
            estimatedDays: 2,
            description: 'Hola, tengo experiencia instalando aires acondicionados. Puedo hacerlo este fin de semana.'
        }, providerToken);
        const offerId = offer.id;
        console.log(`Propuesta enviada con éxito. ID: ${offerId}, Precio: Q${offer.price}`);

        // Step 7: Client and Provider accept/approve the offer (Double confirmation flow)
        console.log('\n[Paso 7] Aprobando la propuesta desde la sesión del Cliente...');
        const clientApproved = await request(`/job-posts/offers/${offerId}/approve`, 'PATCH', {}, clientToken);
        console.log(`Cliente aprobó. senderApproved: ${clientApproved.senderApproved}, receiverApproved: ${clientApproved.receiverApproved}, status: "${clientApproved.status}"`);

        console.log('Aprobando la propuesta desde la sesión del Proveedor...');
        const approvedOffer = await request(`/job-posts/offers/${offerId}/approve`, 'PATCH', {}, providerToken);
        console.log(`Proveedor aprobó. senderApproved: ${approvedOffer.senderApproved}, receiverApproved: ${approvedOffer.receiverApproved}, status: "${approvedOffer.status}"`);

        if (approvedOffer.status !== 'ACCEPTED') {
            throw new Error(`Estado incorrecto: esperado ACCEPTED, obtenido ${approvedOffer.status}`);
        }

        // Step 8: Chat simulation (cross-messages)
        console.log('\n[Paso 8] Enviando mensajes de chat...');
        
        // Client sends message to Provider
        const msg1 = await request(`/chats/${providerId}/messages`, 'POST', {
            content: 'Hola Proveedor QA, excelente propuesta. ¿Cuándo empezamos?'
        }, clientToken);
        console.log(`Mensaje 1 enviado por Cliente: "${msg1.content}"`);

        // Verify Provider has unread count
        const providerChatsBeforeRead = await request('/chats', 'GET', null, providerToken);
        const activeChat = providerChatsBeforeRead.find(c => c.user1Id === clientId || c.user2Id === clientId);
        console.log(`Chats del Proveedor cargados. Chat con Cliente unreadCount: ${activeChat ? activeChat.unreadCount : 'no encontrado'}`);
        if (!activeChat || activeChat.unreadCount !== 1) {
            throw new Error(`UnreadCount incorrecto: esperado 1, obtenido ${activeChat ? activeChat.unreadCount : 'null'}`);
        }

        // Provider marks chat as read
        await request(`/chats/${clientId}/read`, 'PATCH', {}, providerToken);
        console.log('Proveedor marcó conversación como leída.');

        // Verify unread count is now 0
        const providerChatsAfterRead = await request('/chats', 'GET', null, providerToken);
        const activeChatAfter = providerChatsAfterRead.find(c => c.user1Id === clientId || c.user2Id === clientId);
        console.log(`Chat con Cliente unreadCount después de leer: ${activeChatAfter ? activeChatAfter.unreadCount : 'null'}`);
        if (!activeChatAfter || activeChatAfter.unreadCount !== 0) {
            throw new Error(`UnreadCount incorrecto tras lectura: esperado 0, obtenido ${activeChatAfter ? activeChatAfter.unreadCount : 'null'}`);
        }

        // Provider replies to Client
        const msg2 = await request(`/chats/${clientId}/messages`, 'POST', {
            content: 'Hola Cliente QA, gracias. Puedo iniciar este sábado por la mañana.'
        }, providerToken);
        console.log(`Mensaje 2 (respuesta) enviado por Proveedor: "${msg2.content}"`);

        // Step 9: Work Completion
        console.log('\n[Paso 9] Marcando oferta como completada por ambas partes...');
        
        // Client marks complete
        const offerAfterClientComplete = await request(`/job-posts/offers/${offerId}/complete`, 'PATCH', {}, clientToken);
        console.log(`Cliente marcó completo. Status: "${offerAfterClientComplete.status}", senderCompleted: ${offerAfterClientComplete.senderCompleted}, receiverCompleted: ${offerAfterClientComplete.receiverCompleted}`);
        
        // Provider marks complete
        const offerAfterBothComplete = await request(`/job-posts/offers/${offerId}/complete`, 'PATCH', {}, providerToken);
        console.log(`Proveedor marcó completo. Status: "${offerAfterBothComplete.status}" (Debería ser COMPLETED)`);
        if (offerAfterBothComplete.status !== 'COMPLETED') {
            throw new Error(`Estado incorrecto de la oferta completa: esperado COMPLETED, obtenido ${offerAfterBothComplete.status}`);
        }

        // Step 10: Reviews and Ratings
        console.log('\n[Paso 10] Dejando calificaciones y reviews...');
        
        // Client reviews Provider
        await request(`/job-posts/offers/${offerId}/review`, 'POST', {
            rating: 5,
            content: 'Excelente trabajo, muy profesional.'
        }, clientToken);
        console.log('Cliente calificó al Proveedor con 5 estrellas.');

        // Provider reviews Client
        await request(`/job-posts/offers/${offerId}/review`, 'POST', {
            rating: 4,
            content: 'Excelente cliente, puntual y educado.'
        }, providerToken);
        console.log('Proveedor calificó al Cliente con 4 estrellas.');

        // Step 11: Validate profile rating recalculation
        console.log('\n[Paso 11] Validando recálculo del promedio en perfil público...');
        const publicProfile = await request(`/users/public/${providerId}`);
        console.log(`Perfil público del Proveedor:`);
        console.log(`- Nombre: ${publicProfile.name}`);
        console.log(`- Rating Promedio: ${publicProfile.profile?.rating}`);
        console.log(`- Trabajos Completados: ${publicProfile.profile?.jobsCompleted}`);

        if (publicProfile.profile?.rating !== 5) {
            throw new Error(`Rating incorrecto: esperado 5, obtenido ${publicProfile.profile?.rating}`);
        }
        if (publicProfile.profile?.jobsCompleted !== 1) {
            throw new Error(`Trabajos completados incorrecto: esperado 1, obtenido ${publicProfile.profile?.jobsCompleted}`);
        }

        console.log('\n=== ¡TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO! ===');
    } catch (err) {
        console.error('\n❌ ERROR EN LA PRUEBA:', err.message);
        process.exit(1);
    }
}

runTest();
