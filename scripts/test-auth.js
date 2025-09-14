#!/usr/bin/env node

/**
 * Script de test pratique pour les fonctions d'authentification
 * Usage: node scripts/test-auth.js
 */

const BASE_URL = 'http://localhost:3000';

// Couleurs pour la console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n${colors.bold}🧪 Test: ${testName}${colors.reset}`);
  log('─'.repeat(50));
}

function logResult(success, message) {
  const icon = success ? '✅' : '❌';
  const color = success ? 'green' : 'red';
  log(`${icon} ${message}`, color);
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json().catch(() => ({}));
    
    return {
      status: response.status,
      data,
      success: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      success: false
    };
  }
}

async function testWithoutAuth() {
  logTest('Accès sans authentification');
  
  const result = await makeRequest(`${BASE_URL}/api/admin/test`);
  
  logResult(
    result.status === 401,
    `Status: ${result.status} - ${result.data.message || 'No message'}`
  );
  
  if (result.status === 401) {
    log('✓ Correctement refusé - Authentication required', 'green');
  } else {
    log('✗ Devrait être refusé avec 401', 'red');
  }
}

async function testWithInvalidSession() {
  logTest('Accès avec session invalide');
  
  const result = await makeRequest(`${BASE_URL}/api/admin/test`, {
    headers: {
      'Cookie': 'better-auth.session_token=invalid_token_12345'
    }
  });
  
  logResult(
    result.status === 401 || result.status === 403,
    `Status: ${result.status} - ${result.data.message || 'No message'}`
  );
  
  if (result.status === 401 || result.status === 403) {
    log('✓ Correctement refusé - Session invalide', 'green');
  } else {
    log('✗ Devrait être refusé', 'red');
  }
}

async function testWithUserSession() {
  logTest('Accès avec session utilisateur normal');
  
  // Note: Vous devez remplacer par un vrai token de session utilisateur
  const userSessionToken = 'your_user_session_token_here';
  
  if (userSessionToken === 'your_user_session_token_here') {
    log('⚠️  Test ignoré - Remplacez userSessionToken par un vrai token', 'yellow');
    return;
  }
  
  const result = await makeRequest(`${BASE_URL}/api/admin/test`, {
    headers: {
      'Cookie': `better-auth.session_token=${userSessionToken}`
    }
  });
  
  logResult(
    result.status === 403,
    `Status: ${result.status} - ${result.data.message || 'No message'}`
  );
  
  if (result.status === 403) {
    log('✓ Correctement refusé - Access denied', 'green');
  } else {
    log('✗ Devrait être refusé avec 403', 'red');
  }
}

async function testWithAdminSession() {
  logTest('Accès avec session admin');
  
  // Note: Vous devez remplacer par un vrai token de session admin
  const adminSessionToken = 'your_admin_session_token_here';
  
  if (adminSessionToken === 'your_admin_session_token_here') {
    log('⚠️  Test ignoré - Remplacez adminSessionToken par un vrai token', 'yellow');
    return;
  }
  
  const result = await makeRequest(`${BASE_URL}/api/admin/test`, {
    headers: {
      'Cookie': `better-auth.session_token=${adminSessionToken}`
    }
  });
  
  logResult(
    result.status === 200,
    `Status: ${result.status} - ${result.data.message || 'No message'}`
  );
  
  if (result.status === 200) {
    log('✓ Accès autorisé - Admin middleware fonctionne', 'green');
    log(`  Utilisateur: ${result.data.user?.name} (${result.data.user?.role})`, 'blue');
  } else {
    log('✗ Devrait être autorisé avec 200', 'red');
  }
}

async function testPostRequest() {
  logTest('Test POST avec données');
  
  const adminSessionToken = 'your_admin_session_token_here';
  
  if (adminSessionToken === 'your_admin_session_token_here') {
    log('⚠️  Test ignoré - Remplacez adminSessionToken par un vrai token', 'yellow');
    return;
  }
  
  const testData = {
    message: 'Test depuis le script',
    timestamp: new Date().toISOString(),
    value: Math.random()
  };
  
  const result = await makeRequest(`${BASE_URL}/api/admin/test`, {
    method: 'POST',
    headers: {
      'Cookie': `better-auth.session_token=${adminSessionToken}`
    },
    body: JSON.stringify(testData)
  });
  
  logResult(
    result.status === 200,
    `Status: ${result.status} - ${result.data.message || 'No message'}`
  );
  
  if (result.status === 200) {
    log('✓ POST traité avec succès', 'green');
    log(`  Données reçues: ${JSON.stringify(result.data.data?.receivedData)}`, 'blue');
  } else {
    log('✗ POST devrait être traité avec succès', 'red');
  }
}

async function testErrorHandling() {
  logTest('Test gestion d\'erreur');
  
  const adminSessionToken = 'your_admin_session_token_here';
  
  if (adminSessionToken === 'your_admin_session_token_here') {
    log('⚠️  Test ignoré - Remplacez adminSessionToken par un vrai token', 'yellow');
    return;
  }
  
  const result = await makeRequest(`${BASE_URL}/api/admin/test`, {
    method: 'POST',
    headers: {
      'Cookie': `better-auth.session_token=${adminSessionToken}`
    },
    body: JSON.stringify({ triggerError: true })
  });
  
  logResult(
    result.status === 500,
    `Status: ${result.status} - ${result.data.message || 'No message'}`
  );
  
  if (result.status === 500) {
    log('✓ Erreur correctement gérée', 'green');
  } else {
    log('✗ Devrait retourner 500 pour l\'erreur', 'red');
  }
}

async function testUsersEndpoint() {
  logTest('Test endpoint /api/admin/users');
  
  const adminSessionToken = 'your_admin_session_token_here';
  
  if (adminSessionToken === 'your_admin_session_token_here') {
    log('⚠️  Test ignoré - Remplacez adminSessionToken par un vrai token', 'yellow');
    return;
  }
  
  const result = await makeRequest(`${BASE_URL}/api/admin/users`, {
    headers: {
      'Cookie': `better-auth.session_token=${adminSessionToken}`
    }
  });
  
  logResult(
    result.status === 200,
    `Status: ${result.status} - ${result.data.message || 'No message'}`
  );
  
  if (result.status === 200) {
    log('✓ Liste des utilisateurs récupérée', 'green');
    log(`  Nombre d'utilisateurs: ${result.data.data?.total}`, 'blue');
  } else {
    log('✗ Devrait retourner la liste des utilisateurs', 'red');
  }
}

async function runAllTests() {
  log(`${colors.bold}🚀 Démarrage des tests d'authentification${colors.reset}`);
  log('='.repeat(60));
  
  // Vérifier que le serveur est en cours d'exécution
  try {
    const healthCheck = await makeRequest(`${BASE_URL}/api/auth/session`);
    if (!healthCheck.success && healthCheck.status !== 401) {
      log('❌ Serveur non accessible. Assurez-vous que le serveur de développement est en cours d\'exécution.', 'red');
      log('   Commande: npm run dev', 'yellow');
      process.exit(1);
    }
  } catch (error) {
    log('❌ Impossible de se connecter au serveur.', 'red');
    log('   Assurez-vous que le serveur de développement est en cours d\'exécution.', 'yellow');
    process.exit(1);
  }
  
  await testWithoutAuth();
  await testWithInvalidSession();
  await testWithUserSession();
  await testWithAdminSession();
  await testPostRequest();
  await testErrorHandling();
  await testUsersEndpoint();
  
  log('\n' + '='.repeat(60));
  log(`${colors.bold}✨ Tests terminés${colors.reset}`);
  log('\n📝 Notes:');
  log('• Remplacez les tokens de session par de vrais tokens pour les tests complets');
  log('• Les tokens peuvent être obtenus en se connectant via l\'interface web');
  log('• Vérifiez les logs du serveur pour plus de détails');
}

// Exécuter les tests
runAllTests().catch(error => {
  log(`❌ Erreur lors de l'exécution des tests: ${error.message}`, 'red');
  process.exit(1);
});
