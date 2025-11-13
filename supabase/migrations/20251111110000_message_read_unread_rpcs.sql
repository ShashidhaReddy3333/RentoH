-- RPC helpers to keep message unread state in sync between participants

CREATE OR REPLACE FUNCTION public.increment_thread_unread_count(
  p_thread_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  thread_record RECORD;
BEGIN
  IF p_thread_id IS NULL OR p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT tenant_id, landlord_id
  INTO thread_record
  FROM public.message_threads
  WHERE id = p_thread_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF thread_record.tenant_id <> p_user_id AND thread_record.landlord_id <> p_user_id THEN
    RETURN;
  END IF;

  UPDATE public.message_threads
  SET unread_count = COALESCE(unread_count, 0) + 1,
      updated_at = now()
  WHERE id = p_thread_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_thread_unread_count(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.mark_thread_messages_read(
  p_thread_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  thread_record RECORD;
BEGIN
  IF p_thread_id IS NULL OR p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT tenant_id, landlord_id
  INTO thread_record
  FROM public.message_threads
  WHERE id = p_thread_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF thread_record.tenant_id <> p_user_id AND thread_record.landlord_id <> p_user_id THEN
    RETURN;
  END IF;

  UPDATE public.messages
  SET read_at = now()
  WHERE thread_id = p_thread_id
    AND sender_id <> p_user_id
    AND read_at IS NULL;

  UPDATE public.message_threads
  SET unread_count = 0,
      updated_at = now()
  WHERE id = p_thread_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_thread_messages_read(uuid, uuid) TO authenticated, service_role;
