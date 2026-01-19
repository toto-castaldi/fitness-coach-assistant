-- Enable Realtime for lumio_repositories table
-- This allows the frontend to receive live updates when Docora webhooks update repositories

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE lumio_repositories;

-- Enable replica identity for the table (required for UPDATE and DELETE events)
ALTER TABLE lumio_repositories REPLICA IDENTITY FULL;
