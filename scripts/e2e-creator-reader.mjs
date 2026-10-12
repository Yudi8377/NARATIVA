const baseUrl = (process.env.SUPABASE_URL || 'https://hdsqwkydgruyfbqqwhdk.supabase.co').replace(/\/$/, '');
const apiKey = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_m24u_7V16Y-bq_B_YydL-w_dw_4bOb8';
const email = process.env.NARATIVA_E2E_EMAIL;
const password = process.env.NARATIVA_E2E_PASSWORD;

if (!email || !password) {
  console.log('SKIP authenticated creator→reader E2E: set NARATIVA_E2E_EMAIL and NARATIVA_E2E_PASSWORD as CI secrets.');
  process.exit(0);
}

async function request(path, { method = 'GET', token, body, prefer } = {}) {
  const headers = { apikey: apiKey, 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  if (prefer) headers.Prefer = prefer;
  const response = await fetch(baseUrl + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const detail = typeof data === 'object' && data ? (data.message || data.error_description || data.code || JSON.stringify(data)) : String(data);
    throw new Error(method + ' ' + path + ' failed (' + response.status + '): ' + detail);
  }
  return data;
}
function assert(condition, message) {
  if (!condition) throw new Error('ASSERTION FAILED: ' + message);
  console.log('PASS ' + message);
}

let token;
let userId;
let bookId;
let productId;
const stamp = Date.now().toString(36);
const slug = 'e2e-narativa-' + stamp;
const title = 'NARATIVA E2E ' + stamp;
const expectedBody = 'Konten uji baca publik NARATIVA ' + stamp;

try {
  const session = await request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });
  token = session.access_token;
  userId = session.user?.id;
  assert(Boolean(token && userId), 'test creator can authenticate');

  const [book] = await request('/rest/v1/books?select=id,title,status', {
    method: 'POST',
    token,
    prefer: 'return=representation',
    body: {
      owner_id: userId,
      slug,
      title,
      description: expectedBody,
      language_code: 'id',
      content_type: 'storybook',
      status: 'draft',
      rights_metadata: { owner_name: 'NARATIVA E2E Test', license: 'E2E temporary test only', provenance: 'e2e-test' },
      metadata: { e2e_test: true, temporary: true },
    },
  });
  bookId = book?.id;
  assert(Boolean(bookId), 'creator can create a draft work');

  const [version] = await request('/rest/v1/book_versions?select=id,version_number', {
    method: 'POST',
    token,
    prefer: 'return=representation',
    body: {
      book_id: bookId,
      version_number: 1,
      canonical_content: { title, body: expectedBody },
      knowledge_pack: {},
      learning_objectives: [],
      character_pack: [],
      interaction_pack: [],
      change_summary: 'Automated E2E smoke test',
      created_by: userId,
    },
  });
  assert(version?.version_number === 1, 'creator can save canonical version 1');

  const draftPublic = await request('/rest/v1/books?select=id,status&slug=eq.' + encodeURIComponent(slug));
  assert(Array.isArray(draftPublic) && draftPublic.length === 0, 'anonymous reader cannot see a draft');

  const published = await request('/functions/v1/publish-work', {
    method: 'POST',
    token,
    body: { book_id: bookId, rights_confirmed: true },
  });
  assert(published?.ok === true && published.status === 'published', 'creator can publish through the guarded server endpoint');

  const publicBooks = await request('/rest/v1/books?select=id,title,status,description,content_type,language_code,slug&id=eq.' + encodeURIComponent(bookId));
  assert(Array.isArray(publicBooks) && publicBooks.length === 1 && publicBooks[0].status === 'published', 'anonymous reader can load the published work');

  const publicVersions = await request('/rest/v1/book_versions?select=canonical_content,version_number&book_id=eq.' + encodeURIComponent(bookId) + '&order=version_number.desc&limit=1');
  assert(Array.isArray(publicVersions) && publicVersions.length === 1 && publicVersions[0].canonical_content?.body === expectedBody, 'anonymous reader can load the canonical published body');

  const [product] = await request('/rest/v1/commerce_products?select=id,status', {
    method: 'POST',
    token,
    prefer: 'return=representation',
    body: {
      book_id: bookId,
      seller_id: userId,
      title,
      description: expectedBody,
      product_type: 'digital_book',
      currency: 'IDR',
      price_amount_minor: 1000,
      rights_license: 'E2E temporary test only',
      status: 'active',
      metadata: { e2e_test: true, temporary: true },
    },
  });
  productId = product?.id;
  assert(Boolean(productId), 'creator can create an active product for a published work');

  const publicProducts = await request('/rest/v1/commerce_products?select=id,status,book_id&id=eq.' + encodeURIComponent(productId));
  assert(Array.isArray(publicProducts) && publicProducts.length === 1 && publicProducts[0].status === 'active', 'anonymous reader can see the active product for a published work');

  console.log('PASS creator → save → publish → anonymous read → Commerce catalog flow.');
} finally {
  const cleanupErrors = [];
  if (productId && token && userId) {
    try {
      await request('/rest/v1/commerce_products?id=eq.' + encodeURIComponent(productId) + '&seller_id=eq.' + encodeURIComponent(userId), { method: 'DELETE', token, prefer: 'return=minimal' });
      console.log('CLEANUP temporary commerce product removed');
    } catch (error) { cleanupErrors.push('product cleanup: ' + error.message); }
  }
  if (bookId && token && userId) {
    try {
      await request('/rest/v1/books?id=eq.' + encodeURIComponent(bookId) + '&owner_id=eq.' + encodeURIComponent(userId), { method: 'DELETE', token, prefer: 'return=minimal' });
      console.log('CLEANUP temporary E2E work removed');
    } catch (error) { cleanupErrors.push('work cleanup: ' + error.message); }
  }
  if (cleanupErrors.length) throw new Error('E2E cleanup requires manual review: ' + cleanupErrors.join('; '));
}
