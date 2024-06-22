import './style.css'
import { Octokit } from '@octokit/core'
import { paginateRest } from "@octokit/plugin-paginate-rest";

import { Chart } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

const MyOctokit = Octokit.plugin(paginateRest);

const octokit = new MyOctokit({})

// Fetch and update the graph based on user input
async function updateGraph() {
  const owner = (document.getElementById('owner') as HTMLInputElement).value || 'microsoft';
  const repo = (document.getElementById('repo') as HTMLInputElement).value || 'playwright';
  const issue_number = parseInt((document.getElementById('issue_number') as HTMLInputElement).value) || 28863;

  const reactionList = await octokit.paginate("GET /repos/{owner}/{repo}/issues/{issue_number}/reactions", {
    owner,
    repo,
    issue_number,
  });

  const reactions = reactionList.reduce((acc, reaction) => ({
    ...acc,
    [reaction.content]: [...(acc[reaction.content] || []), reaction]
  }), {} as Record<string, typeof reactionList>);

  // Assuming `reactions` is your data object from the previous code
  const labels = Object.keys(reactions); // Reaction types as labels
  const datasets = labels.map(label => {
    return {
      label: label,
      data: reactions[label].map((reaction, i) => ({ x: reaction.created_at, y: i })), // Reaction counts as data
      fill: false,
      borderColor: getRandomColor(), // A function to generate a random color for each line
    };
  });
  console.log(datasets)

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
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = 'loaded'

// Add event listener to the update graph button
document.getElementById('updateGraph')!.addEventListener('click', updateGraph);

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
