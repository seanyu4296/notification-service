

describe('getNotificationX',() => {
  it('should not accept invalid', async () => {
    const x = await Promise.resolve(5);
    console.log(x);
  })
  it('should accept valid notification types', async () => {

  })
});


describe('sendNotification', () => {
  it('should return a Left when sending timeouts', async () => {

  });
  it('should return a Right when it succeeds', async () => {

  });
})

describe('attemptSendNotification', () => {
  it('should mark a notification received if notification is successfully acknowledged', async () => {
    
  })
  it('should not send a notification when it reached its attempt limit', async () => {

  })
})