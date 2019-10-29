document.addEventListener('DOMContentLoaded', () => {
  window.tryToEnterTeamDomain = () => {
    return new Promise((resolve) => {
      try {
        const input = document.querySelector('input[name=domain]');
        const submit = document.querySelector('#submit_team_domain');
        const alreadySignedInBtn = Array.from(document.querySelectorAll('a.btn'))
          .find(el => el.textContent === 'Slack Corp');

        if (alreadySignedInBtn) {
          alreadySignedInBtn.click();

          setTimeout(() => resolve(), 300);
        } else if (input && submit) {
          input.value = 'tinyspeck';
          submit.click();

          setTimeout(() => resolve(), 300);
        }
      } catch (e) {
        console.log(e);
        resolve();
      }
    });
  };

  window.tryToLaunchGlobal = () => {
    try {
      const a = document.querySelector('a[href="https://tinyspeck.slack.com/messages"]');

      console.log(`Trying to launch global`, a);

      if (a) {
        a.click();
        setTimeout(() => resolve(), 300);
      } else {
        setTimeout(() => window.tryToLaunchGlobal(), 150);
      }
    } catch (e) {
      console.log(e);
    }
  }
});
