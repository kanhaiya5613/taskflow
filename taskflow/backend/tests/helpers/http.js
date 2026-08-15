import supertest from 'supertest';

export default async function request(app, method, url, body) {
  const agent = supertest(app);
  const methodFn = agent[method.toLowerCase()].bind(agent);
  const res = body !== undefined ? await methodFn(url).send(body) : await methodFn(url);
  return res;
}
