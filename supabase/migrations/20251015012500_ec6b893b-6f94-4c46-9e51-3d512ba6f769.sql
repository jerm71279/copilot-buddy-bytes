-- Add field to link related change requests
ALTER TABLE public.change_requests 
ADD COLUMN IF NOT EXISTS related_change_id UUID REFERENCES public.change_requests(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_change_requests_related ON public.change_requests(related_change_id);

-- Add comment to explain usage
COMMENT ON COLUMN public.change_requests.related_change_id IS 'Links automated change requests to their planned counterpart. Auto-logged changes reference the original planned CR here.';