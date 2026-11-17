function copy(es, en) {
  return `<span class="plans-copy" translate="no"><span lang="es-MX">${es}</span><span lang="en">${en}</span></span>`;
}

const pricePeriod = copy('MXN / 30 días', 'MXN / 30 days');
const compareRows = [
  [copy('Explorar y compartir publicaciones', 'Browse and share publications'), copy('Incluido', 'Included'), copy('Incluido', 'Included')],
  [copy('Carpetas de organización', 'Organization folders'), copy('Incluidas', 'Included'), copy('Incluidas', 'Included')],
  [copy('Límite de aportaciones', 'Contribution limit'), '3', '100'],
  [copy('Apoyo voluntario con Coins', 'Voluntary Coin tips'), copy('Incluido', 'Included'), copy('Incluido', 'Included')],
  [copy('Estudio Premium', 'Premium Studio'), copy('No incluido', 'Not included'), copy('Incluido', 'Included')],
  [copy('Coins incluidos en el plan', 'Coins included in the plan'), '0', '0'],
  [copy('Publicaciones reservadas para Premium', 'Premium publications'), copy('Según su costo', 'Depends on the price'), copy('Con autorización del autor', 'With the author’s permission')]
];

function coinPackage(amount) {
  return `<button class="plans-package${amount === 50 ? ' selected' : ''}" type="button" data-coin-package="${amount}" aria-pressed="${amount === 50}">
    <strong>${amount} Coins</strong><span>$${amount} MXN</span>
  </button>`;
}

const content = `<main class="uhz-plans" id="contenido-principal">
  <header class="plans-header">
    <div class="plans-intro">
      <h1 id="principal-title">${copy('Planes y Coins', 'Plans and Coins')}</h1>
      <p>${copy('Empieza gratis o elige Premium para acceder a más herramientas y ampliar tu capacidad de publicación.', 'Start for free or choose Premium for more tools and higher publishing limits.')}</p>
    </div>
    <aside class="plans-account" aria-labelledby="plans-account-title">
      <h2 id="plans-account-title">${copy('Mi cuenta', 'My account')}</h2>
      <dl>
        <div><dt>${copy('Membresía actual', 'Current membership')}</dt><dd id="tier">Consultando…</dd></div>
        <div><dt>${copy('Saldo de Coins', 'Coin balance')}</dt><dd id="balance">—</dd></div>
      </dl>
      <a class="plans-link" id="accountLink" href="/iniciar-sesion?next=%2Fplanes">${copy('Consultar mi cuenta', 'View my account')}</a>
    </aside>
  </header>

  <nav class="plans-jump" aria-labelledby="plans-jump-title">
    <span id="plans-jump-title" class="plans-sr-only">${copy('Navegación de planes', 'Plans navigation')}</span>
    <a href="#membresias">${copy('Membresías', 'Memberships')}</a>
    <a href="#comparar">${copy('Comparar', 'Compare')}</a>
    <a href="#coins">Coins</a>
    <a href="#historial">${copy('Historial', 'Activity')}</a>
    <a href="#creadores">${copy('Creadores', 'Creators')}</a>
    <a href="#preguntas">${copy('Preguntas frecuentes', 'FAQs')}</a>
  </nav>

  <section class="plans-section" id="membresias" aria-labelledby="memb-title">
    <h2 id="memb-title">${copy('Membresías', 'Memberships')}</h2>
    <div class="plans-grid">
      <article class="plans-card plans-membership">
        <h3>${copy('Gratis', 'Free')}</h3>
        <p class="plans-price"><strong>$0</strong><small>${copy('MXN · sin mensualidad', 'MXN · no monthly fee')}</small></p>
        <p>${copy('Explora publicaciones y comparte tus propios recursos.', 'Explore publications and share your own resources.')}</p>
        <ul class="plans-benefits">
          <li>${copy('Consulta y comparte publicaciones gratuitas.', 'Read and share free publications.')}</li>
          <li>${copy('Organiza tus recursos en carpetas y publica dentro del límite de tu cuenta.', 'Organize your resources in folders and publish within your account limit.')}</li>
          <li>${copy('Envía y recibe Coins como apoyo voluntario cuando participe un creador verificado.', 'Send and receive voluntary Coin tips when a verified creator is involved.')}</li>
          <li>${copy('Consulta tus movimientos y participa en la comunidad.', 'View your activity and take part in the community.')}</li>
        </ul>
        <a class="plans-button" href="/">${copy('Comenzar gratis', 'Start for free')}</a>
      </article>
      <article class="plans-card plans-membership plans-premium">
        <h3>Premium</h3>
        <p class="plans-price"><strong>$49</strong><small>${pricePeriod}</small></p>
        <p>${copy('Más capacidad para publicar y herramientas para organizar tu trabajo.', 'Higher publishing limits and tools to organize your work.')}</p>
        <ul class="plans-benefits">
          <li>${copy('Todos los beneficios de Gratis.', 'All Free plan benefits.')}</li>
          <li>${copy('Mayor capacidad para aportar y administrar publicaciones.', 'Higher limits for contributions and publication management.')}</li>
          <li>${copy('Estudio Premium con lotes de hasta 20 imágenes, campañas de 50 QR y revisión editorial CSV.', 'Premium Studio with batches of up to 20 images, QR campaigns of 50 and CSV editorial review.')}</li>
          <li>${copy('Acceso a los recursos que el autor incluya en Premium.', 'Access to resources the author makes available with Premium.')}</li>
        </ul>
        <a class="plans-button plans-button-primary" href="/mi-cuenta">${copy('Revisar mi membresía', 'Check my membership')}</a>
      </article>
    </div>
  </section>

  <section class="plans-section" id="comparar" aria-labelledby="comparar-title">
    <h2 id="comparar-title">${copy('Comparar beneficios', 'Compare benefits')}</h2>
    <div class="plans-table">
      <table aria-labelledby="comparar-title">
        <thead><tr><th scope="col">${copy('Beneficio', 'Benefit')}</th><th scope="col">${copy('Gratis', 'Free')}</th><th scope="col">Premium</th></tr></thead>
        <tbody>
          ${compareRows.map(([label, free, premium]) => `<tr><th scope="row">${label}</th><td>${free}</td><td>${premium}</td></tr>`).join('\n          ')}
        </tbody>
      </table>
    </div>
    <details class="plans-disclosure">
      <summary>${copy('Planes en desarrollo · Creador y Estudio', 'Plans in development · Creator and Studio')}</summary>
      <div class="plans-disclosure-content plans-grid">
        <article class="plans-card plans-membership">
          <h3>${copy('Creador', 'Creator')}</h3>
          <p class="plans-price"><strong>$149</strong><small>${copy('MXN / 30 días · propuesto', 'MXN / 30 days · proposed')}</small></p>
          <ul class="plans-benefits">
            <li>${copy('Funciones de Premium y hasta 10 GB de almacenamiento privado sujetos a validación.', 'Premium features and up to 10 GB of private storage, subject to validation.')}</li>
            <li>${copy('Propuestas de precio para artículos y revisión de derechos.', 'Article pricing proposals and rights review.')}</li>
            <li>${copy('Enlaces cortos y QR personalizados con estadísticas de clics.', 'Custom short links and QR codes with click statistics.')}</li>
          </ul>
          <p class="plans-note">${copy('La contratación está pendiente de validar el alojamiento y las liquidaciones.', 'Sign-ups depend on hosting and settlement validation.')}</p>
          <a class="plans-link" href="/herramientas/monetizar">${copy('Preparar mis publicaciones', 'Prepare my publications')}</a>
        </article>
        <article class="plans-card plans-membership">
          <h3>${copy('Estudio', 'Studio')}</h3>
          <p class="plans-price"><strong>$349</strong><small>${copy('MXN / 30 días · propuesto', 'MXN / 30 days · proposed')}</small></p>
          <ul class="plans-benefits">
            <li>${copy('Funciones propuestas para Creador y hasta 50 GB sujetos a costos reales.', 'Proposed Creator features and up to 50 GB, subject to actual costs.')}</li>
            <li>${copy('Estadísticas avanzadas y programación de publicaciones.', 'Advanced analytics and scheduled publishing.')}</li>
            <li>${copy('Video y estrenos con límites de uso.', 'Video and premieres with usage limits.')}</li>
          </ul>
          <p class="plans-note">${copy('La contratación y el precio definitivo dependen de las pruebas.', 'Sign-ups and final pricing depend on testing.')}</p>
          <a class="plans-link" href="/herramientas/monetizar">${copy('Conocer monetización', 'Learn about monetization')}</a>
        </article>
      </div>
    </details>
  </section>

  <section class="plans-section" id="coins" aria-labelledby="coins-title">
    <h2 id="coins-title">Coins</h2>
    <div class="plans-card plans-coins">
      <p>${copy('Usa Coins para apoyar a creadores o acceder a recursos. Tus aportaciones originales pueden recibir Coins después de su aprobación y publicación.', 'Use Coins to support creators or access resources. Your original contributions can earn Coins after approval and publication.')}</p>
      <a class="plans-button" href="/Aportar_contenido/coins">${copy('Ver cómo ganar Coins', 'See how to earn Coins')}</a>
    </div>
    <details class="plans-disclosure">
      <summary>${copy('Paquetes de referencia', 'Example Coin packages')}</summary>
      <div class="plans-disclosure-content">
        <p>${copy('La compra de paquetes sigue en preparación. Los importes sirven como referencia en pesos mexicanos.', 'Coin package purchases are still in development. Amounts are shown as reference values in Mexican pesos.')}</p>
        <div class="plans-packages" id="coinPackages" role="group" aria-labelledby="plans-package-title">
          <span class="plans-sr-only" id="plans-package-title">${copy('Paquetes de Coins', 'Coin packages')}</span>
          ${[50, 150, 500].map(coinPackage).join('\n          ')}
        </div>
        <div class="plans-coin-estimate" id="coinForm">
          <label for="coinAmount">${copy('Cantidad de Coins (1 a 5,000)', 'Number of Coins (1 to 5,000)')}</label>
          <input type="number" id="coinAmount" min="1" max="5000" step="1" inputmode="numeric" value="50">
          <p id="coinPrice" role="status"><span id="coinReference">${copy('Referencia', 'Reference')} <strong id="coinReferenceAmount">$50 MXN</strong></span><span id="coinInvalid" hidden>${copy('Elige entre 1 y 5,000 Coins.', 'Enter 1 to 5,000 Coins.')}</span></p>
        </div>
      </div>
    </details>
  </section>

  <section class="plans-section" id="historial" aria-labelledby="history-title">
    <h2 id="history-title">${copy('Historial de apoyo', 'Support activity')}</h2>
    <div class="plans-grid">
      <article class="plans-card plans-history">
        <h3>${copy('Coins enviados', 'Coins sent')}</h3>
        <strong id="uhzTipSent">—</strong>
        <ol id="uhzTipSentList"><li>Consultando…</li></ol>
      </article>
      <article class="plans-card plans-history">
        <h3>${copy('Coins recibidos', 'Coins received')}</h3>
        <strong id="uhzTipReceived">—</strong>
        <ol id="uhzTipReceivedList"><li>Consultando…</li></ol>
      </article>
    </div>
  </section>

  <section class="plans-section" id="creadores" aria-labelledby="creators-title">
    <h2 id="creators-title">${copy('Para creadores', 'For creators')}</h2>
    <details class="plans-disclosure" id="herramientas-en-preparacion">
      <summary>${copy('Herramientas para crear y vender', 'Tools to create and sell')}</summary>
      <div class="plans-disclosure-content">
        <p>${copy('El acortador de enlaces y el generador de QR básicos ya están disponibles con una cuenta verificada. El almacenamiento privado, la monetización y los reportes avanzados siguen en desarrollo.', 'Basic link shortening and QR codes are available with a verified account. Private storage, monetization and advanced reporting are in development.')}</p>
        <a class="plans-link" href="/herramientas/acortador">${copy('Abrir acortador y QR', 'Open short links and QR codes')}</a>
        <a class="plans-link" href="/Aportar_contenido">${copy('Publicar contenido', 'Publish content')}</a>
      </div>
    </details>
    <details class="plans-disclosure">
      <summary>${copy('Propuesta de remuneración', 'Proposed creator payouts')}</summary>
      <div class="plans-disclosure-content">
        <p>${copy('La propuesta pendiente de aprobación asignaría al creador el 35% del precio base, equivalente a $0.35 MXN por Coin comprado, donado y elegible. Antes de aprobar un pago se revisarían los fondos, las devoluciones y los requisitos fiscales.', 'The proposal, pending approval, would allocate 35% of the base price to the creator, or $0.35 MXN per purchased, donated and eligible Coin. Funds, refunds and tax requirements would be reviewed before approving a payment.')}</p>
        <div class="plans-simulator">
          <label for="simCoins">${copy('Simula un apoyo', 'Estimate a tip')} <strong id="simQuantity">10 Coins</strong></label>
          <input id="simCoins" type="range" min="1" max="100" value="10" step="1">
          <dl class="plans-grid">
            <div><dt>${copy('Creador · propuesto', 'Creator · proposed')}</dt><dd id="simCreator">$3.50</dd></div>
            <div><dt>${copy('Resto del precio base', 'Remaining base price')}</dt><dd id="simPlatform">$6.50</dd></div>
          </dl>
          <p class="plans-note">${copy('Importes en MXN. El resto del precio todavía cubre impuestos, comisiones, devoluciones y costos operativos. La simulación sólo considera Coins comprados y elegibles.', 'Amounts are in MXN. The remaining price still covers taxes, fees, refunds and operating costs. The estimate only applies to purchased, eligible Coins.')}</p>
        </div>
      </div>
    </details>
    <details class="plans-disclosure" id="proteccion">
      <summary>${copy('Reglas de protección para apoyos', 'Safeguards for Coin tips')}</summary>
      <div class="plans-disclosure-content">
        <ul class="plans-benefits">
          <li>${copy('Registrar por separado los Coins comprados y las recompensas.', 'Track purchased Coins and rewards separately.')}</li>
          <li>${copy('Bloquear los apoyos a la propia cuenta y revisar las operaciones entre cuentas relacionadas.', 'Block self-tips and review activity between related accounts.')}</li>
          <li>${copy('Verificar identidad, documentación fiscal, contracargos y fondos antes de aprobar liquidaciones.', 'Verify identity, tax documentation, chargebacks and funds before approving settlements.')}</li>
        </ul>
      </div>
    </details>
  </section>

  <section class="plans-section" id="preguntas" aria-labelledby="faq-title">
    <h2 id="faq-title">${copy('Preguntas frecuentes', 'Frequently asked questions')}</h2>
    <details class="plans-disclosure">
      <summary>${copy('¿Cuánto dura Premium?', 'How long does Premium last?')}</summary>
      <div class="plans-disclosure-content"><p>${copy('La membresía Premium dura 30 días. Puedes revisar su vigencia desde Mi cuenta y renovarla cuando lo decidas.', 'Premium lasts 30 days. Check your membership in My account and renew it when you choose.')}</p></div>
    </details>
    <details class="plans-disclosure">
      <summary>${copy('¿Qué publicaciones incluye Premium?', 'What publications does Premium include?')}</summary>
      <div class="plans-disclosure-content"><p>${copy('Premium incluye las publicaciones que sus autores habiliten para ese plan. Los Coins para desbloqueos y apoyos se administran por separado.', 'Premium includes publications whose authors enable them for the plan. Coins for unlocks and tips are managed separately.')}</p></div>
    </details>
    <details class="plans-disclosure">
      <summary>${copy('¿Cómo funcionan los apoyos con Coins?', 'How do Coin tips work?')}</summary>
      <div class="plans-disclosure-content"><p>${copy('Los apoyos a creadores son voluntarios. Puedes seguir consultando las publicaciones gratuitas de la comunidad.', 'Coin tips are voluntary. You can continue to read free community publications.')}</p></div>
    </details>
    <details class="plans-disclosure">
      <summary>${copy('¿Puedo comprar o retirar Coins?', 'Can I buy or withdraw Coins?')}</summary>
      <div class="plans-disclosure-content"><p>${copy('La compra y el retiro de Coins siguen en preparación. En esta página puedes consultar tu saldo y los apoyos dentro de UNIVERSHZRW.', 'Coin purchases and withdrawals are still in development. This page shows your balance and tips within UNIVERSHZRW.')}</p></div>
    </details>
  </section>
</main>`;

function initializeCoinReference() {
  const input = document.getElementById('coinAmount');
  const reference = document.getElementById('coinReference');
  const referenceAmount = document.getElementById('coinReferenceAmount');
  const invalid = document.getElementById('coinInvalid');
  const packages = document.querySelectorAll('#coinPackages [data-coin-package]');

  function update() {
    const count = input.valueAsNumber;
    const valid = Number.isInteger(count) && count >= Number(input.min) && count <= Number(input.max);
    reference.hidden = !valid;
    invalid.hidden = valid;
    if (valid) {
      const locale = document.documentElement.lang === 'en' ? 'en-US' : 'es-MX';
      referenceAmount.textContent = '$' + new Intl.NumberFormat(locale).format(count) + ' MXN';
    }
    for (const option of packages) {
      const selected = valid && Number(option.dataset.coinPackage) === count;
      option.classList.toggle('selected', selected);
      option.setAttribute('aria-pressed', String(selected));
    }
  }

  input.addEventListener('input', update);
  for (const option of packages) {
    option.addEventListener('click', () => {
      input.value = option.dataset.coinPackage;
      update();
    });
  }
  window.addEventListener('uhz:language-change', update);
  update();
}

export function preparePlansLayout(source, css) {
  const declaration = /^const HTML=("[^\n]+");$/m;
  const match = source.match(declaration);
  if (!match || !css.trim()) throw new Error('The Plans HTML or stylesheet is missing.');
  const html = JSON.parse(match[1]);
  const originalMain = /<main class="uhz-plans[^"]*" id="contenido-principal">[\s\S]*?<\/main>/g;
  const originalStyle = /<style>[\s\S]*?<\/style>/g;
  const originalReference = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .filter(([, body]) => body.includes('function checkGateway()') && body.includes("const input=$('coinAmount')"));
  if ([...html.matchAll(originalMain)].length !== 1 ||
      [...html.matchAll(originalStyle)].length !== 1 ||
      originalReference.length !== 1) {
    throw new Error('The source does not match the published Plans layout.');
  }

  const updated = html
    .replace(originalMain, () => content)
    .replace(originalStyle, () => '<style>\n' + css.trim() + '\n</style>')
    .replace(originalReference[0][0], () => '<script>(' + initializeCoinReference.toString() + ')();</script>');
  return source.replace(declaration, () => 'const HTML=' + JSON.stringify(updated) + ';');
}
