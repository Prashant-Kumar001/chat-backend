import { server} from './app.js';

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${ process.env.NODE_ENV} mode`);
});
