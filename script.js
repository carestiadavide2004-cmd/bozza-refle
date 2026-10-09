(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var body = document.body;
  var WA_NUMBER = 'https://wa.me/393402365315';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  var euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  function price(n) { return euro.format(n); }

  /* Blocca lo scroll della pagina quando il menu o una finestra sono aperti */
  function syncScrollLock() {
    var locked = body.classList.contains('menu-open') || !!document.querySelector('dialog[open]');
    body.classList.toggle('no-scroll', locked);
  }

  /* =========================================================
     Header e menu
     ========================================================= */

  var header = $('#site-header');
  var hero = $('#home');

  function updateHeader() {
    // diventa chiaro quando arriva alla sfumatura avorio in fondo all'hero (ultimo 18%)
    var heroEnd = hero.offsetHeight * 0.82 - header.offsetHeight;
    header.classList.toggle('is-solid', window.scrollY > heroEnd);
  }

  var toggle = $('#menu-toggle');
  var toggleLabel = $('#menu-toggle-label');
  var menu = $('#site-menu');
  var menuLinks = $$('a', menu);

  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggleLabel.textContent = open ? 'Chiudi il menu' : 'Apri il menu';
    menuLinks.forEach(function (a) { a.tabIndex = open ? 0 : -1; });
    syncScrollLock();
    if (open) setTimeout(function () { menuLinks[0].focus({ preventScroll: true }); }, 350);
  }
  setMenu(false);

  toggle.addEventListener('click', function () {
    setMenu(!body.classList.contains('menu-open'));
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a[href^="#"]')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && body.classList.contains('menu-open')) {
      setMenu(false);
      toggle.focus();
    }
  });

  /* =========================================================
     Comparsa allo scroll
     ========================================================= */

  var revealables = $$('.reveal, .reveal-title, .mondo');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    revealables.forEach(function (node) { io.observe(node); });
  } else {
    revealables.forEach(function (node) { node.classList.add('is-in'); });
  }

  /* =========================================================
     Movimento legato allo scroll: hero, riflessi, eventi
     ========================================================= */

  var heroContent = $('[data-parallax-content]');
  var slides = $$('[data-slide]').map(function (node) {
    return {
      node: node,
      dir: node.dataset.slide === 'left' ? -1 : 1,
      photo: $('[data-slide-photo]', node),
      text: $('[data-slide-text]', node)
    };
  });

  var mondo = $('#mondo');
  var mondoMedia = $('.mondo__media', mondo);
  var mondoText = $('[data-mondo-text]', mondo);

  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

  function updateMotion() {
    if (reduceMotion.matches) return;
    var vh = window.innerHeight;
    var vw = window.innerWidth;
    var y = window.scrollY;
    var small = vw < 700;

    if (y < vh) {
      heroContent.style.transform = 'translate3d(0,' + (y * 0.25).toFixed(1) + 'px,0)';
      heroContent.style.opacity = String(clamp(1 - y / (vh * 0.7), 0, 1));
    }

    slides.forEach(function (s) {
      var r = s.node.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      // 0 quando la riga entra dal basso, 1 quando è ben dentro lo schermo
      var p = clamp((vh - r.top) / (vh * (small ? 0.6 : 0.75)), 0, 1);
      var e = 1 - Math.pow(1 - p, 3);
      var distance = small ? vw * 0.14 : vw * 0.22;
      s.photo.style.transform = 'translate3d(' + ((1 - e) * s.dir * distance).toFixed(1) + 'px,0,0)';
      s.photo.style.opacity = e.toFixed(3);

      var drift = (r.top + r.height / 2 - vh / 2) * (small ? -0.05 : -0.12);
      var t = clamp(e * 1.25 - 0.25, 0, 1);
      s.text.style.transform = 'translate3d(0,' + (drift + (1 - t) * 40).toFixed(1) + 'px,0)';
      s.text.style.opacity = t.toFixed(3);
    });

    // Il mondo Reflè: la foto scorre più lenta del testo
    var mr = mondo.getBoundingClientRect();
    if (mr.bottom > 0 && mr.top < vh) {
      var mp = (mr.top + mr.height / 2 - vh / 2) / (vh / 2 + mr.height / 2); // da 1 a -1
      mondoMedia.style.transform = 'translate3d(0,' + (-mp * mr.height * (small ? 0.03 : 0.05)).toFixed(1) + 'px,0)';
      mondoText.style.transform = 'translate3d(0,' + (mp * (small ? 24 : 70)).toFixed(1) + 'px,0)';
    }

  }

  function clearMotion() {
    heroContent.style.transform = heroContent.style.opacity = '';
    slides.forEach(function (s) {
      s.photo.style.transform = s.photo.style.opacity = '';
      s.text.style.transform = s.text.style.opacity = '';
    });
    mondoMedia.style.transform = mondoText.style.transform = '';
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      updateHeader();
      updateMotion();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener('change', function () {
      if (reduceMotion.matches) clearMotion();
      onScroll();
    });
  }
  onScroll();

  /* =========================================================
     Catalogo (prodotti e prezzi di esempio)
     ========================================================= */

  var CLOTHES = ['XS', 'S', 'M', 'L', 'XL'];
  var ONE_SIZE = ['Taglia unica'];

  var CATEGORIES = {
    sera: {
      title: 'Cerimonia & sera',
      sizes: CLOTHES,
      items: [
        ['sera-plisse', 'Abito lungo plissé in chiffon', 199],
        ['sera-2', 'Abito in tulle bordeaux', 249],
        ['sera-3', 'Abito lungo nero con spacco', 179],
        ['sera-4', 'Abito a sirena bordeaux', 229],
        ['sera-5', 'Abito verde smeraldo con pizzo', 239],
        ['sera-6', 'Abito lungo in paillettes', 259]
      ]
    },
    tailleur: {
      title: 'Tailleur & completi',
      sizes: CLOTHES,
      items: [
        ['tailleur-1', 'Tailleur avorio', 189],
        ['tailleur-2', 'Completo in tweed a quadri', 209],
        ['tailleur-3', 'Blazer doppiopetto principe di Galles', 139],
        ['tailleur-4', 'Tailleur pantalone blu notte', 179],
        ['tailleur-5', 'Blazer nero sciancrato', 129],
        ['tailleur-6', 'Blazer verde smeraldo', 135]
      ]
    },
    giorno: {
      title: 'Giorno',
      sizes: CLOTHES,
      items: [
        ['giorno-1', 'Abito a portafoglio a fiori', 79],
        ['giorno-2', 'Abito lungo a righe', 69],
        ['giorno-3', 'Abito giallo in voile', 75],
        ['giorno-4', 'Abito rosso a pois', 65],
        ['giorno-5', 'Abito lungo a fiori rosa', 85],
        ['giorno-6', 'Blusa a quadretti e gonna a fiori', 89]
      ]
    },
    accessori: {
      title: 'Accessori',
      sizes: ONE_SIZE,
      items: [
        ['accessori-1', 'Borsa grigia con borchie', 69],
        ['accessori-2', 'Pochette trapuntata bianca', 49],
        ['accessori-3', 'Anelli con pietre colorate', 29],
        ['accessori-4', 'Orecchini dorati', 25],
        ['accessori-5', 'Collane di perle', 35],
        ['accessori-6', 'Borsa a tracolla cipria', 59]
      ]
    }
  };

  // indice veloce id → prodotto
  var PRODUCTS = {};
  Object.keys(CATEGORIES).forEach(function (key) {
    CATEGORIES[key].items.forEach(function (it) {
      PRODUCTS[it[0]] = { id: it[0], name: it[1], price: it[2], img: 'img/catalogo/' + it[0] + '.jpg', sizes: CATEGORIES[key].sizes };
    });
  });

  var shop = $('#shop');
  var shopTitle = $('#shop-title');
  var productList = $('#products');
  var shopOpener = null;

  function renderCategory(key) {
    var cat = CATEGORIES[key];
    shopTitle.textContent = cat.title;
    productList.textContent = '';

    cat.items.forEach(function (it, i) {
      var p = PRODUCTS[it[0]];
      var li = el('li', 'product');
      li.style.animationDelay = (0.08 * i + 0.15) + 's';

      var photo = el('button', 'product__photo frame zoom');
      photo.type = 'button';
      photo.setAttribute('aria-label', 'Ingrandisci la foto: ' + p.name);
      var img = el('img');
      img.src = p.img;
      img.alt = '';
      img.width = 800;
      img.height = 1000;
      img.loading = 'lazy';
      img.decoding = 'async';
      photo.appendChild(img);
      photo.addEventListener('click', function () {
        var list = cat.items.map(function (x) {
          var q = PRODUCTS[x[0]];
          return { src: q.img, alt: q.name, caption: q.name + ' · ' + price(q.price) };
        });
        openLightbox(list, i, photo);
      });

      var head = el('div', 'product__head');
      head.appendChild(el('h3', 'product__name', p.name));
      head.appendChild(el('span', 'product__price', price(p.price)));

      var fs = el('fieldset', 'sizes');
      fs.appendChild(el('legend', '', 'Taglia'));
      p.sizes.forEach(function (size) {
        var label = el('label', 'size');
        var input = el('input');
        input.type = 'radio';
        input.name = 'size-' + p.id;
        input.value = size;
        if (p.sizes.length === 1 || size === 'M') input.checked = true;
        label.appendChild(input);
        label.appendChild(el('span', '', size));
        fs.appendChild(label);
      });

      var add = el('button', 'btn btn--dark', 'Aggiungi al carrello');
      add.type = 'button';
      add.addEventListener('click', function () {
        var chosen = $('input:checked', fs);
        var size = chosen ? chosen.value : p.sizes[0];
        addToCart(p.id, size);
        add.classList.add('is-added');
        add.textContent = 'Aggiunto';
        setTimeout(function () {
          add.classList.remove('is-added');
          add.textContent = 'Aggiungi al carrello';
        }, 1600);
        openCart(p.name + ' (' + size + ') aggiunto al carrello');
      });

      li.appendChild(photo);
      li.appendChild(head);
      li.appendChild(fs);
      li.appendChild(add);
      productList.appendChild(li);
    });
  }

  function openShop(key, trigger) {
    shopOpener = trigger;
    renderCategory(key);
    shop.showModal();
    shop.scrollTop = 0;
    syncScrollLock();
    $('[data-close-shop]', shop).focus();
  }

  $$('.vetrina').forEach(function (btn) {
    btn.addEventListener('click', function () { openShop(btn.dataset.category, btn); });
  });
  $$('[data-close-shop]').forEach(function (btn) {
    btn.addEventListener('click', function () { shop.close(); });
  });
  shop.addEventListener('close', function () {
    syncScrollLock();
    if (shopOpener) shopOpener.focus();
  });

  /* =========================================================
     Carrello (salvato nel browser)
     ========================================================= */

  var STORAGE_KEY = 'refle-carrello';
  var cart = loadCart();

  function loadCart() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(saved) ? saved.filter(function (line) {
        return line && PRODUCTS[line.id] && typeof line.qty === 'number' && line.qty > 0;
      }) : [];
    } catch (err) {
      return [];
    }
  }

  function saveCart() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (err) { /* archiviazione non disponibile */ }
  }

  function findLine(id, size) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id && cart[i].size === size) return cart[i];
    }
    return null;
  }

  function addToCart(id, size) {
    var line = findLine(id, size);
    if (line) line.qty += 1;
    else cart.push({ id: id, size: size, qty: 1 });
    commit(true);
  }

  function changeQty(id, size, delta) {
    var line = findLine(id, size);
    if (!line) return;
    line.qty += delta;
    if (line.qty < 1) removeLine(id, size);
    else commit();
  }

  function removeLine(id, size) {
    cart = cart.filter(function (l) { return !(l.id === id && l.size === size); });
    commit();
  }

  function count() { return cart.reduce(function (n, l) { return n + l.qty; }, 0); }
  function total() { return cart.reduce(function (n, l) { return n + l.qty * PRODUCTS[l.id].price; }, 0); }

  function waText(intro) {
    var lines = cart.map(function (l) {
      return PRODUCTS[l.id].name + ' (' + l.size + ') x' + l.qty;
    });
    return WA_NUMBER + '?text=' + encodeURIComponent(intro + ' ' + lines.join(', '));
  }

  var cartDialog = $('#cart');
  var cartList = $('#cart-list');
  var cartEmpty = $('#cart-empty');
  var cartFoot = $('#cart-foot');
  var cartTotal = $('#cart-total');
  var cartWa = $('#cart-wa');
  var cartAdded = $('#cart-added');
  var cartOpener = null;

  function commit(bump) {
    saveCart();
    renderCart();
    var n = count();
    $$('[data-cart-count]').forEach(function (badge) {
      badge.textContent = String(n);
      badge.classList.toggle('has-items', n > 0);
      if (bump && !reduceMotion.matches) {
        badge.classList.remove('bump');
        void badge.offsetWidth;
        badge.classList.add('bump');
      }
    });
    $$('[data-open-cart]').forEach(function (btn) {
      btn.setAttribute('aria-label', 'Carrello, ' + n + (n === 1 ? ' articolo' : ' articoli'));
    });
  }

  function renderCart() {
    cartList.textContent = '';
    var empty = cart.length === 0;
    cartEmpty.hidden = !empty;
    cartFoot.hidden = empty;
    cartList.hidden = empty;

    cart.forEach(function (l) {
      var p = PRODUCTS[l.id];
      var li = el('li', 'cart-item');

      var img = el('img');
      img.src = p.img;
      img.alt = '';
      img.width = 72;
      img.height = 90;

      var info = el('div');
      var top = el('div', 'cart-item__top');
      top.appendChild(el('p', 'cart-item__name', p.name));
      top.appendChild(el('span', 'cart-item__price', price(p.price * l.qty)));
      info.appendChild(top);
      info.appendChild(el('p', 'cart-item__size', 'Taglia: ' + l.size));

      var row = el('div', 'cart-item__row');
      var qty = el('div', 'qty');
      qty.setAttribute('role', 'group');
      qty.setAttribute('aria-label', 'Quantità di ' + p.name);
      var minus = el('button', '', '−');
      minus.type = 'button';
      minus.setAttribute('aria-label', 'Diminuisci');
      minus.addEventListener('click', function () { changeQty(l.id, l.size, -1); });
      var out = el('output', '', String(l.qty));
      var plus = el('button', '', '+');
      plus.type = 'button';
      plus.setAttribute('aria-label', 'Aumenta');
      plus.addEventListener('click', function () { changeQty(l.id, l.size, 1); });
      qty.appendChild(minus);
      qty.appendChild(out);
      qty.appendChild(plus);

      var remove = el('button', 'cart-item__remove', 'Rimuovi');
      remove.type = 'button';
      remove.setAttribute('aria-label', 'Rimuovi ' + p.name + ' dal carrello');
      remove.addEventListener('click', function () { removeLine(l.id, l.size); });

      row.appendChild(qty);
      row.appendChild(remove);
      info.appendChild(row);

      li.appendChild(img);
      li.appendChild(info);
      cartList.appendChild(li);
    });

    cartTotal.textContent = price(total());
    cartWa.href = empty ? WA_NUMBER : waText('Ciao! Vorrei informazioni su:');
  }

  function openCart(message) {
    if (message) {
      cartAdded.hidden = false;
      // riavvia l'animazione di conferma
      cartAdded.textContent = '';
      void cartAdded.offsetWidth;
      cartAdded.textContent = message;
    } else {
      cartAdded.hidden = true;
    }
    if (cartDialog.open) return;
    cartOpener = document.activeElement;
    cartDialog.classList.remove('is-closing');
    cartDialog.showModal();
    syncScrollLock();
    $('[data-close-cart]', cartDialog).focus();
  }

  function closeCart() {
    if (!cartDialog.open || cartDialog.classList.contains('is-closing')) return;
    if (reduceMotion.matches) { cartDialog.close(); return; }
    cartDialog.classList.add('is-closing');
    setTimeout(function () {
      cartDialog.classList.remove('is-closing');
      cartDialog.close();
    }, 330);
  }

  $$('[data-open-cart]').forEach(function (btn) {
    btn.addEventListener('click', function () { openCart(); });
  });
  $$('[data-close-cart]').forEach(function (btn) {
    btn.addEventListener('click', closeCart);
  });
  cartDialog.addEventListener('cancel', function (e) { e.preventDefault(); closeCart(); });
  cartDialog.addEventListener('click', function (e) { if (e.target === cartDialog) closeCart(); });
  cartDialog.addEventListener('close', function () {
    syncScrollLock();
    if (cartOpener && document.contains(cartOpener)) cartOpener.focus();
  });

  $('[data-browse]').addEventListener('click', function () {
    closeCart();
    if (!shop.open) {
      setTimeout(function () { $('#catalogo').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' }); }, 350);
    }
  });

  /* ---------- Riepilogo ordine (nessun pagamento online) ---------- */

  var checkout = $('#checkout');
  var checkoutList = $('#checkout-list');

  $('#cart-buy').addEventListener('click', function () {
    checkoutList.textContent = '';
    cart.forEach(function (l) {
      var p = PRODUCTS[l.id];
      var li = el('li');
      li.appendChild(el('span', '', p.name + ' (' + l.size + ') × ' + l.qty));
      li.appendChild(el('span', '', price(p.price * l.qty)));
      checkoutList.appendChild(li);
    });
    $('#checkout-total').textContent = price(total());
    $('#checkout-wa').href = waText('Ciao! Vorrei acquistare:');
    checkout.showModal();
    syncScrollLock();
  });
  $$('[data-close-checkout]').forEach(function (btn) {
    btn.addEventListener('click', function () { checkout.close(); });
  });
  checkout.addEventListener('close', syncScrollLock);

  commit(false);

  /* =========================================================
     Cursore personalizzato (solo mouse, niente con movimento ridotto)
     ========================================================= */

  (function () {
    var cursor = $('#cursor');
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    var CLICKABLE = 'a, button, label, select, input, textarea, summary, [role="button"], .vetrina, .product__photo';
    var x = 0, y = 0, cx = 0, cy = 0;
    var running = false;
    var enabled = false;

    function loop() {
      if (!enabled) { running = false; return; }
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      cursor.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      requestAnimationFrame(loop);
    }

    // le finestre aperte stanno sopra la pagina: il cerchio va dentro l'ultima aperta
    function placeOnTop() {
      var open = $$('dialog[open]');
      var host = open.length ? open[open.length - 1] : body;
      if (cursor.parentNode !== host) host.appendChild(cursor);
    }

    function onMove(e) {
      x = e.clientX;
      y = e.clientY;
      if (!cursor.classList.contains('is-visible')) {
        cx = x; cy = y;
        cursor.classList.add('is-visible');
      }
      placeOnTop();
      var target = e.target instanceof Element ? e.target : null;
      cursor.classList.toggle('is-hover', !!(target && target.closest(CLICKABLE)));
      // sulle foto e i fondi scuri il cerchio diventa chiaro, tranne sopra i pulsanti chiari
      var light = target && target.closest('[data-cursor-light]') && !target.closest('[data-cursor-dark]');
      cursor.classList.toggle('is-light', !!light);
      if (!running) { running = true; requestAnimationFrame(loop); }
    }

    function onLeave() { cursor.classList.remove('is-visible'); }

    function update() {
      var should = finePointer.matches && !reduceMotion.matches;
      if (should === enabled) return;
      enabled = should;
      document.documentElement.classList.toggle('has-cursor', enabled);
      if (enabled) {
        document.addEventListener('mousemove', onMove, { passive: true });
        document.documentElement.addEventListener('mouseleave', onLeave);
      } else {
        document.removeEventListener('mousemove', onMove);
        document.documentElement.removeEventListener('mouseleave', onLeave);
        cursor.classList.remove('is-visible', 'is-hover', 'is-light');
      }
    }

    [finePointer, reduceMotion].forEach(function (mq) {
      if (mq.addEventListener) mq.addEventListener('change', update);
    });
    update();
  })();

  /* =========================================================
     Lightbox (foto dei prodotti)
     ========================================================= */

  var lightbox = $('#lightbox');
  var lbFrame = $('#lightbox-frame');
  var lbImg = $('#lightbox-img');
  var lbCaption = $('#lightbox-caption');
  var lbCount = $('#lightbox-count');
  var lbStage = $('#lightbox-stage');
  var lbItems = [];
  var current = 0;
  var lbOpener = null;

  function show(index) {
    current = (index + lbItems.length) % lbItems.length;
    var item = lbItems[current];
    lbFrame.classList.add('is-loading');
    var pre = new Image();
    pre.onload = pre.onerror = function () {
      lbImg.src = item.src;
      lbImg.alt = item.alt;
      requestAnimationFrame(function () { lbFrame.classList.remove('is-loading'); });
    };
    pre.src = item.src;
    lbCaption.textContent = item.caption;
    lbCount.textContent = (current + 1) + ' / ' + lbItems.length;
  }

  function openLightbox(items, index, trigger) {
    lbItems = items;
    lbOpener = trigger;
    show(index);
    lightbox.showModal();
    syncScrollLock();
  }

  $('#lightbox-close').addEventListener('click', function () { lightbox.close(); });
  $('#lightbox-prev').addEventListener('click', function () { show(current - 1); });
  $('#lightbox-next').addEventListener('click', function () { show(current + 1); });

  lightbox.addEventListener('close', function () {
    syncScrollLock();
    if (lbOpener) lbOpener.focus();
  });
  lightbox.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
  });
  lbStage.addEventListener('click', function (e) {
    if (e.target === lbStage) lightbox.close();
  });

  var touchX = null;
  var touchY = null;
  lbStage.addEventListener('touchstart', function (e) {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }, { passive: true });
  lbStage.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    var dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(dx < 0 ? current + 1 : current - 1);
    touchX = touchY = null;
  }, { passive: true });
})();
