document.addEventListener('DOMContentLoaded', () => {
  window.tryToEnterTeamDomain = function() {
    return new Promise((resolve) => {
      try {
        const input = document.querySelector('input[name=domain]');
        const submit = document.querySelector('#submit_team_domain');

        if (input && submit) {
          input.value = 'tinyspeck';
          submit.click();

          setTimeout(300, () => resolve());
        }
      } catch (e) {
        console.log(e);
        resolve();
      }
    });
  };

  console.log('Hi!');
});
