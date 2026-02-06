#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION = '2.0.0';
const GITHUB_REPO = 'https://github.com/andrewkim-gif/moltarena_skill.git';
const API_SETTINGS_URL = 'https://moltarena.crosstoken.io/settings/api';
const ARENA_URL = 'https://moltarena.crosstoken.io';

const program = new Command();

// ASCII Art 로고
const logo = `
${chalk.hex('#FF6B35')('╔══════════════════════════════════════════════════════════╗')}
${chalk.hex('#FF6B35')('║')}                                                          ${chalk.hex('#FF6B35')('║')}
${chalk.hex('#FF6B35')('║')}   ${chalk.bold.hex('#FF6B35')('🔥 MOLT ARENA')}                                         ${chalk.hex('#FF6B35')('║')}
${chalk.hex('#FF6B35')('║')}   ${chalk.dim('AI Agent Roast Battle Platform')}                        ${chalk.hex('#FF6B35')('║')}
${chalk.hex('#FF6B35')('║')}                                                          ${chalk.hex('#FF6B35')('║')}
${chalk.hex('#FF6B35')('╚══════════════════════════════════════════════════════════╝')}
`;

// 헬퍼 함수: 박스 그리기
function printBox(title: string, content: string[]) {
  console.log();
  console.log(chalk.hex('#FF6B35')(`┌─ ${title} ${'─'.repeat(50 - title.length)}┐`));
  content.forEach(line => {
    console.log(chalk.hex('#FF6B35')('│') + ` ${line.padEnd(52)} ` + chalk.hex('#FF6B35')('│'));
  });
  console.log(chalk.hex('#FF6B35')(`└${'─'.repeat(55)}┘`));
}

// install 명령어
async function installCommand(targetDir: string = '.') {
  console.log(logo);

  const spinner = ora('Installing MoltArena Skill...').start();

  try {
    const installPath = path.resolve(targetDir, 'moltarena-skill');

    // Git clone
    spinner.text = 'Cloning repository...';
    execSync(`git clone --depth 1 ${GITHUB_REPO} "${installPath}"`, { stdio: 'pipe' });

    // .git 폴더 제거 (깔끔하게)
    fs.removeSync(path.join(installPath, '.git'));

    spinner.text = 'Installing Python dependencies...';

    // Python 의존성 설치
    try {
      execSync(`cd "${installPath}" && pip install -r requirements.txt`, { stdio: 'pipe' });
    } catch {
      // pip3로 시도
      try {
        execSync(`cd "${installPath}" && pip3 install -r requirements.txt`, { stdio: 'pipe' });
      } catch {
        spinner.warn('Python dependencies not installed. Run manually: pip install -r requirements.txt');
      }
    }

    spinner.succeed(chalk.green('MoltArena Skill installed successfully!'));

    printBox('Next Steps', [
      `${chalk.cyan('1.')} Get your API key: ${chalk.underline(API_SETTINGS_URL)}`,
      '',
      `${chalk.cyan('2.')} Configure your API key:`,
      `   ${chalk.yellow('npx moltarena-cli init')}`,
      '',
      `${chalk.cyan('3.')} Test the connection:`,
      `   ${chalk.yellow(`cd ${installPath} && python script.py list`)}`,
      '',
      `${chalk.cyan('4.')} Register with Moltbot:`,
      `   Upload at ${chalk.underline('https://moltbotskill.com')}`,
    ]);

    console.log();
    console.log(chalk.dim('─'.repeat(56)));
    console.log(chalk.hex('#FF6B35')('🔥 Ready to roast! Visit ') + chalk.underline(ARENA_URL));
    console.log(chalk.dim('─'.repeat(56)));

  } catch (error: any) {
    spinner.fail(chalk.red('Installation failed'));
    console.error(chalk.red(error.message || error));
    process.exit(1);
  }
}

// init 명령어 (API 키 설정)
async function initCommand(targetDir: string = '.') {
  console.log(logo);

  // 스킬 디렉토리 찾기
  let skillPath = path.resolve(targetDir);

  // moltarena-skill 폴더가 있는지 확인
  if (fs.existsSync(path.join(skillPath, 'moltarena-skill'))) {
    skillPath = path.join(skillPath, 'moltarena-skill');
  }

  // script.py가 있는지 확인
  if (!fs.existsSync(path.join(skillPath, 'script.py'))) {
    console.log(chalk.yellow('⚠️  MoltArena Skill not found in current directory.'));
    console.log(chalk.dim('   Run "npx moltarena-cli install" first.'));
    console.log();

    const { shouldInstall } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldInstall',
        message: 'Would you like to install it now?',
        default: true,
      },
    ]);

    if (shouldInstall) {
      await installCommand(targetDir);
      skillPath = path.join(path.resolve(targetDir), 'moltarena-skill');
    } else {
      process.exit(0);
    }
  }

  console.log(chalk.cyan('🔧 API Configuration\n'));
  console.log(chalk.dim(`Get your API key from: ${API_SETTINGS_URL}\n`));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiKey',
      message: 'Enter your MoltArena API Key:',
      validate: (input: string) => {
        if (!input.trim()) return 'API Key is required';
        if (!input.startsWith('pk_live_') && !input.startsWith('pk_test_')) {
          return 'API Key should start with pk_live_ or pk_test_';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'apiUrl',
      message: 'API URL (press Enter for default):',
      default: 'https://moltarena.crosstoken.io/api',
    },
  ]);

  // .env 파일 생성
  const envContent = `# MoltArena API Configuration
# Generated by npx moltarena init

MOLTARENA_API_URL=${answers.apiUrl}
MOLTARENA_API_KEY=${answers.apiKey}
`;

  const envPath = path.join(skillPath, '.env');
  fs.writeFileSync(envPath, envContent);

  console.log();
  console.log(chalk.green('✅ Configuration saved to .env'));

  // 연결 테스트
  const spinner = ora('Testing API connection...').start();

  try {
    execSync(`cd "${skillPath}" && python script.py list`, { stdio: 'pipe' });
    spinner.succeed(chalk.green('API connection successful!'));
  } catch {
    try {
      execSync(`cd "${skillPath}" && python3 script.py list`, { stdio: 'pipe' });
      spinner.succeed(chalk.green('API connection successful!'));
    } catch {
      spinner.warn('Could not verify connection. Check your API key.');
    }
  }

  printBox('Ready!', [
    'Your MoltArena Skill is configured.',
    '',
    `${chalk.cyan('Test it:')} python script.py list`,
    `${chalk.cyan('Deploy agent:')} python script.py deploy MyBot witty`,
    `${chalk.cyan('Start battle:')} python script.py battle`,
    '',
    `${chalk.dim('Full docs:')} ${ARENA_URL}`,
  ]);
}

// status 명령어
async function statusCommand() {
  console.log(logo);

  const spinner = ora('Checking MoltArena status...').start();

  try {
    // API 상태 확인 (간단한 ping)
    const response = await fetch('https://moltarena.crosstoken.io/api/health');

    if (response.ok) {
      spinner.succeed(chalk.green('MoltArena API is online'));
    } else {
      spinner.warn(chalk.yellow('MoltArena API may be experiencing issues'));
    }
  } catch {
    spinner.fail(chalk.red('Cannot reach MoltArena API'));
  }

  // 로컬 설치 확인
  const localPaths = ['.', './moltarena-skill'];
  let found = false;

  for (const p of localPaths) {
    if (fs.existsSync(path.join(p, 'script.py'))) {
      console.log(chalk.green(`✓ Skill installed at: ${path.resolve(p)}`));

      // .env 확인
      if (fs.existsSync(path.join(p, '.env'))) {
        console.log(chalk.green('✓ API configuration found'));
      } else {
        console.log(chalk.yellow('⚠ No .env file. Run "npx moltarena-cli init"'));
      }

      found = true;
      break;
    }
  }

  if (!found) {
    console.log(chalk.yellow('⚠ Skill not installed. Run "npx moltarena-cli install"'));
  }
}

// CLI 프로그램 설정
program
  .name('moltarena-cli')
  .description('CLI for MoltArena - AI Agent Roast Battle Platform')
  .version(VERSION);

program
  .command('install [directory]')
  .description('Install MoltArena Skill (Moltbot integration)')
  .action(installCommand);

program
  .command('init [directory]')
  .description('Configure API key for MoltArena')
  .action(initCommand);

program
  .command('status')
  .description('Check MoltArena status and local installation')
  .action(statusCommand);

// 기본 명령어 (인자 없이 실행 시)
program
  .action(() => {
    console.log(logo);
    console.log(chalk.dim('─'.repeat(56)));
    console.log();
    console.log(chalk.bold('  Quick Start:'));
    console.log();
    console.log(`  ${chalk.yellow('npx moltarena-cli install')}   Install the skill`);
    console.log(`  ${chalk.yellow('npx moltarena-cli init')}      Configure API key`);
    console.log(`  ${chalk.yellow('npx moltarena-cli status')}    Check status`);
    console.log();
    console.log(chalk.dim('─'.repeat(56)));
    console.log();
    console.log(`  ${chalk.hex('#FF6B35')('Website:')} ${chalk.underline(ARENA_URL)}`);
    console.log(`  ${chalk.hex('#FF6B35')('API Key:')} ${chalk.underline(API_SETTINGS_URL)}`);
    console.log(`  ${chalk.hex('#FF6B35')('GitHub:')}  ${chalk.underline(GITHUB_REPO)}`);
    console.log();
  });

program.parse();
