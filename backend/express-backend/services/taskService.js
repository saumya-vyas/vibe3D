import redisClient from '../../shared/redisClient.js'

class TaskService {
  async handleTask({image, type}) {

      const taskId = await redisClient.addTask(image, type);

    return { taskId };
  }
}

const taskService = new TaskService();
export default taskService