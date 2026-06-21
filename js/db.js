/* ── Supabase client + all data-access functions ── */
(function () {
  const cfg = window.MANA_CONFIG;
  const { createClient } = window.supabase;
  const db = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  window.MANA_DB = db;

  /* ── Sessions ── */
  window.getSessions = async function (filter = 'all') {
    let q = db.from('sessions').select('*').eq('is_published', true).order('date', { ascending: false });
    if (filter === 'upcoming') q = q.eq('is_upcoming', true);
    if (filter === 'past')     q = q.eq('is_upcoming', false);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  };

  window.getSessionBySlug = async function (slug) {
    const { data, error } = await db
      .from('sessions')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    if (error) throw error;
    return data;
  };

  window.getFeaturedSession = async function () {
    const { data, error } = await db
      .from('sessions')
      .select('*')
      .eq('is_published', true)
      .eq('is_featured', true)
      .eq('is_upcoming', true)
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  };

  /* ── Books ── */
  window.getBooks = async function (category = null, status = null) {
    let q = db.from('books').select('*').eq('is_published', true).order('created_at', { ascending: false });
    if (category) q = q.eq('category', category);
    if (status)   q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  };

  /* ── Engagements ── */
  window.getEngagements = async function (limit = null) {
    let q = db.from('engagements').select('*').eq('is_published', true).order('sort_order', { ascending: true });
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  };

  /* ── FAQs ── */
  window.getFAQs = async function () {
    const { data, error } = await db
      .from('faqs')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  };

  /* ── Committee ── */
  window.getCommittee = async function () {
    const { data, error } = await db
      .from('committee_members')
      .select('*')
      .eq('is_published', true)
      .eq('consent_to_publish', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  };

  /* ── Forms / writes ── */
  window.submitRegistration = async function (payload) {
    const { error } = await db.from('registrations').insert([payload]);
    if (error) throw error;
  };

  window.submitSubscriber = async function (payload) {
    /* handle duplicate email gracefully */
    const { error } = await db.from('subscribers').upsert([payload], { onConflict: 'email', ignoreDuplicates: true });
    if (error) throw error;
  };

  window.submitJoinInterest = async function (payload) {
    const { error } = await db.from('join_interest').insert([payload]);
    if (error) throw error;
  };

  window.submitContactMessage = async function (payload) {
    const { error } = await db.from('contact_messages').insert([payload]);
    if (error) throw error;
  };

  window.submitBookInterest = async function (bookId, email) {
    /* Reuse subscribers table with source tag, or store separately */
    const { error } = await db.from('subscribers').upsert(
      [{ email, consent: true, source: `book_interest_${bookId}` }],
      { onConflict: 'email', ignoreDuplicates: true }
    );
    if (error) throw error;
  };

  /* ── Admin helpers ── */
  window.adminGetAll = async function (table) {
    const { data, error } = await db.from(table).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  };

  window.adminUpsert = async function (table, row) {
    const { data, error } = await db.from(table).upsert([row]).select();
    if (error) throw error;
    return data[0];
  };

  window.adminDelete = async function (table, id) {
    const { error } = await db.from(table).delete().eq('id', id);
    if (error) throw error;
  };

  window.adminUploadImage = async function (bucket, file, path) {
    const { data, error } = await db.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = db.storage.from(bucket).getPublicUrl(path);
    return urlData.publicUrl;
  };
})();
