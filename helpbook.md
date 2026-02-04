To undo/remove that migration, you need to do two things: Drop the table it created and remove the record from our tracking table.

Run these two commands in your terminal:

1. Drop the table
   powershell
   docker exec my_backend_postgres psql -U backend_user -d unitoko_new_db_feb -c "DROP TABLE IF EXISTS users CASCADE;"
2. Remove it from the history
   So that the system knows it's allowed to run again (or so it disappears from the history):

powershell
docker exec my_backend_postgres psql -U backend_user -d unitoko_new_db_feb -c "DELETE FROM migrations WHERE name = '001_initial_schema.sql';"
Pro-Tip: The "Easy Way" for Development
If you are just starting and haven't added data you care about yet, the "Atomic Reset" is much faster:

powershell
docker-compose down -v; docker-compose up -d
This kills the entire database and the tracking history in one go, giving you a 100% clean slate.

Which would you like me to do for you right now? I can run the specific "Undo" commands or the full "Reset".
