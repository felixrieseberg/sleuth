> :warning: While I loved working at Slack, all of us must eventually move on, and so I have. The wonderful people still there are now in charge of Sleuth, so please find it over at https://github.com/tinyspeck/sleuth.

# Sleuth

A Slack Log Viewer.

# Development

```sh
git clone https://github.com/felixrieseberg/sleuth
cd sleuth
git submodule update --init --recursive
npm i
npm start
```

# Releases

Releases are now fully automated and happen entirely within GitHub Actions.
To release a new version, follow the following steps:

1) Create a new version (for instance with `yarn version`). This should
   update the version number in `package.json` and create a new `git` tag.
2) Push the updated `package.json` and new `git` tag (`git push && git push --tags`).
3) GitHub Actions will automatically build Sleuth for all platforms and "draft"
   [a new release](https://github.com/felixrieseberg/sleuth/releases).
4) Check the draft and make sure that all expected assets are there. A quick and
   easy way to do that is to check if the drafted release has the same assets
   as the latest published release.
5) If things look good, "publish" the draft. Sleuth's autoupdater will automatically
   push it out to people.

