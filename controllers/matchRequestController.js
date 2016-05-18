const MatchRequest = require('../models/matchRequest.js');
const User = require('../models/user.js');
const Match = require('../models/match.js');
const walletController = require('./walletController.js');
const Profile = require('../models/profile.js');
const Fitness = require('../models/fitness.js');

module.exports.saveOne = (req, res) => {
  const facebookId = req.body.facebookId;
  const likedUserId = req.body.likedUserId;
      // handle transaction
  walletController.spendSteps(facebookId, likedUserId, (wallet => {
    // add match request to match request table
    User.findOne({ where: { facebookId } }).then((user) => {
      const userId = user.get('id');
      MatchRequest.create({
        fromUserId: userId,
        toUserId: likedUserId,
      }).then(() => {
        // check for corresponing match request
        MatchRequest.findOne({
          where: {
            fromUserId: likedUserId,
            toUserId: userId,
          },
        }).then(likedMatchRequest => {
          // Save relationship to match table if there is a corresponding match request
          if (likedMatchRequest) {
            Match.create({
              fromUserId: likedUserId,
              toUserId: userId,
            }).then(() => {
              Match.create({
                fromUserId: userId,
                toUserId: likedUserId,
              }).then(() => {
                // Find the likedUser information
                User.findOne({
                  where: {
                    id: likedUserId,
                  },
                  include: [
                    {
                      model: Profile,
                      where: {},
                    },
                    {
                      model: Fitness,
                      where: {},
                    },
                  ],
                }).then(likedUser => {
                  res.status(201).json({
                    steps: wallet.steps,
                    newMatch: {
                      id: likedUser.get('id'),
                      firstName: likedUser.get('firstName'),
                      picturePath: likedUser.profile.get('picturePath'),
                    },
                  });
                });
              });
            });
            // let the client know they have a new a match
          } else {
            res.status(201).json({ steps: wallet.steps, newMatch: null });
          }
        });
      });
    });
  }));
};
