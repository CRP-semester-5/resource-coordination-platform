import { getTasks, getTaskById, formatTaskWithTeamInfo } from './src/repositories/task.repository.js';
import { supabase } from './src/config/supabase.js';
(async () => {
  const tasks = await getTasks();
  if (tasks.data && tasks.data.length > 0) {
      let res = await supabase
          .from("tasks")
          .select(`
              task_assignments (
                  volunteers (
                      volunteer_id,
                      user_id
                  )
              )
          `)
          .eq("task_id", tasks.data[0].task_id)
          .single();
    console.log(JSON.stringify(res.data, null, 2));
  }
  process.exit(0);
})();
