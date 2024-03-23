import * as core from '@actions/core';
import * as github from '@actions/github';
import axios from 'axios';

import { replaceMsg } from './util';

// **********************************************************
async function main(): Promise<void> {
  try {
    // **********************************************************

    const dingdingToken = core.getInput('dingding-token');

    const { owner, repo } = github.context.repo;
    const { info } = core;

    info(`owner: ${owner}, repo: ${repo}`);

    const {
      name: releaseName,
      body: releaseBody,
      tag_name: version,
    } = github.context.payload.release;

    info(`
      releaseName: ${JSON.stringify(releaseName)}, 
      releaseBody: ${JSON.stringify(releaseBody)}, 
      version: ${version},
      `);

    if (dingdingToken) {
      let log = '';
      let msgTitle = core.getInput('msg-title');
      const msgFooter = core.getInput('msg-footer');
      const msgPoster = core.getInput('msg-poster');

      const replaceMsg4Me = (msg: string) => {
        return replaceMsg(msg, version, owner, repo);
      };

      if (msgTitle) {
        msgTitle = replaceMsg4Me(msgTitle);
      } else {
        msgTitle = `# ${version} 发布日志`;
      }

      if (msgPoster) {
        log = `![](${msgPoster})\n\n${log}`;
      }

      if (msgFooter) {
        log += `\n\n${replaceMsg4Me(msgFooter)}`;
      }

      const time = core.getInput('dingding-delay-minute') || 0;
      info(`[Actions] [time] ${time} start: ${Date.now()}`);

      setTimeout(async () => {
        info(`[Actions] [time] ${time} go: ${Date.now()}`);
        const dingdingTokenArr = dingdingToken.split(' ');
        /* eslint-disable no-await-in-loop, no-restricted-syntax */
        for (const dingdingTokenKey of dingdingTokenArr) {
          if (dingdingTokenKey) {
            await axios.post(
              `https://oapi.dingtalk.com/robot/send?access_token=${dingdingTokenKey}`,
              {
                msgtype: 'markdown',
                markdown: {
                  title: `${version} 发布日志`,
                  text: `${msgTitle} \n\n ${releaseBody} \n\n ${log}`,
                },
              },
            );
          }
        }

        info(`[Actions] Success post dingding message of ${version}`);
      }, +time * 1000 * 60);
    }
  } catch (e: any) {
    core.error(`[Actions] Error: ${e.message}`);
  }
}

main();
