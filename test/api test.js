const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server'); // your server.js export
const expect = chai.expect;

chai.use(chaiHttp);

describe('API Routes', () => {
  const testUser = {
    username: 'testuser123',
    password: 'testpass123',
    name: 'Test User',
    location: 'Denver'
  };

  it('should sign up a new user', (done) => {
    chai.request(app)
      .post('/signup')
      .send(testUser)
      .end((err, res) => {
        expect(res).to.have.status.oneOf([201, 409]); // 201 if new, 409 if exists
        expect(res.body).to.have.property('success');
        done();
      });
  });

  it('should sign in with correct credentials', (done) => {
    chai.request(app)
      .post('/signin')
      .send({ username: testUser.username, password: testUser.password })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('token');
        done();
      });
  });

  it('should return hourly forecast (default location)', (done) => {
    chai.request(app)
      .get('/forecast/hourly')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body.forecast).to.have.property('forecast').that.is.an('array');
        done();
      });
  });
});
