import './style.css'
import { Octokit } from '@octokit/core'
import { paginateRest } from "@octokit/plugin-paginate-rest";

import { Chart } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

const MyOctokit = Octokit.plugin(paginateRest);

const octokit = new MyOctokit({})

async function updateGraph() {
  const owner = (document.getElementById('owner') as HTMLInputElement).value;
  const repo = (document.getElementById('repo') as HTMLInputElement).value;
  const issue_number = parseInt((document.getElementById('issue_number') as HTMLInputElement).value);

  if (!owner || !repo || !issue_number) {
    alert('Please fill in all fields');
    return;
  }

  const reactionList = await octokit.paginate("GET /repos/{owner}/{repo}/issues/{issue_number}/reactions", {
    owner,
    repo,
    issue_number,
  });

  const reactions = reactionList.reduce((acc, reaction) => ({
    ...acc,
    [reaction.content]: [...(acc[reaction.content] || []), reaction]
  }), {} as Record<string, typeof reactionList>);

  const labels = Object.keys(reactions); 
  const datasets = labels.map(label => {
    return {
      label: label,
      data: reactions[label].map((reaction, i) => ({ x: reaction.created_at, y: i })), 
      fill: false,
      borderColor: getRandomColor(), // A function to generate a random color for each line
    };
  });

  const ctx = (document.getElementById('myChart')! as HTMLCanvasElement).getContext('2d')!;
  new Chart(ctx, {
    type: 'line',
    data: {
      datasets: datasets,
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        },
        x: {
          type: 'time',
          time: {
            displayFormats: {
              quarter: 'MMM YYYY'
            }
          }
        }
      }
    }
  });
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = 'loaded'
}

window.addEventListener('load', () => {
  document.querySelector('form')!.addEventListener('submit', (e) => {
    e.preventDefault();
    updateGraph()
  });
});

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
