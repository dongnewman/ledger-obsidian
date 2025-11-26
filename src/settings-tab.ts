import { buyMeACoffee, paypal } from './graphics';
import { t, setLocale, languages, Language } from './i18n';
import LedgerPlugin from './main';
import { PluginSettingTab, Setting } from 'obsidian';

export class SettingsTab extends PluginSettingTab {
  private readonly plugin: LedgerPlugin;

  constructor(plugin: LedgerPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  public display(): void {
    const { containerEl } = this;
    containerEl.empty();

    setLocale(this.plugin.settings.language as Language);

    containerEl.createEl('h2', { text: t('settings-title') });

    new Setting(containerEl)
      .setName(t('language'))
      .setDesc(t('language-desc'))
      .addDropdown((dropdown) => {
        for (const key in languages) {
          dropdown.addOption(key, languages[key as Language]);
        }
        dropdown.setValue(this.plugin.settings.language);
        dropdown.onChange(async (value) => {
          this.plugin.settings.language = value;
          await this.plugin.saveData(this.plugin.settings);
          this.display(); // Refresh to apply language change
        });
      });

    new Setting(containerEl)
      .setName(t('currency-symbol'))
      .setDesc(t('currency-symbol-desc'))
      .addText((text) => {
        text.setPlaceholder('$').setValue(this.plugin.settings.currencySymbol);
        text.inputEl.onblur = (e: FocusEvent) => {
          this.plugin.settings.currencySymbol = (
            e.target as HTMLInputElement
          ).value;
          this.plugin.saveData(this.plugin.settings);
        };
      });

    new Setting(containerEl)
      .setName(t('ledger-file'))
      .setDesc(t('ledger-file-desc'))
      .addText((text) => {
        text
          .setValue(this.plugin.settings.ledgerFile)
          .setPlaceholder('transactions.ledger');
        text.inputEl.onblur = (e: FocusEvent) => {
          const target = e.target as HTMLInputElement;
          const newValue = target.value;

          if (newValue.endsWith('.ledger')) {
            target.setCustomValidity('');
            this.plugin.settings.ledgerFile = newValue;
            this.plugin.saveData(this.plugin.settings);
          } else {
            target.setCustomValidity('File must end with .ledger');
          }
          target.reportValidity();
        };
      });

    containerEl.createEl('h3', { text: t('transaction-account-prefixes') });

    containerEl.createEl('p', {
      text: t('transaction-account-prefixes-desc'),
    });

    new Setting(containerEl)
      .setName(t('asset-account-prefix'))
      .setDesc(t('asset-account-prefix-desc'))
      .addText((text) => {
        text.setValue(this.plugin.settings.assetAccountsPrefix);
        text.inputEl.onblur = (e: FocusEvent) => {
          this.plugin.settings.assetAccountsPrefix = (
            e.target as HTMLInputElement
          ).value;
          this.plugin.saveData(this.plugin.settings);
        };
      });

    new Setting(containerEl)
      .setName(t('expense-account-prefix'))
      .setDesc(t('expense-account-prefix-desc'))
      .addText((text) => {
        text.setValue(this.plugin.settings.expenseAccountsPrefix);
        text.inputEl.onblur = (e: FocusEvent) => {
          this.plugin.settings.expenseAccountsPrefix = (
            e.target as HTMLInputElement
          ).value;
          this.plugin.saveData(this.plugin.settings);
        };
      });

    new Setting(containerEl)
      .setName(t('income-account-prefix'))
      .setDesc(t('income-account-prefix-desc'))
      .addText((text) => {
        text.setValue(this.plugin.settings.incomeAccountsPrefix);
        text.inputEl.onblur = (e: FocusEvent) => {
          this.plugin.settings.incomeAccountsPrefix = (
            e.target as HTMLInputElement
          ).value;
          this.plugin.saveData(this.plugin.settings);
        };
      });

    new Setting(containerEl)
      .setName(t('liability-account-prefix'))
      .setDesc(t('liability-account-prefix-desc'))
      .addText((text) => {
        text.setValue(this.plugin.settings.liabilityAccountsPrefix);
        text.inputEl.onblur = (e: FocusEvent) => {
          this.plugin.settings.liabilityAccountsPrefix = (
            e.target as HTMLInputElement
          ).value;
          this.plugin.saveData(this.plugin.settings);
        };
      });

    const div = containerEl.createEl('div', {
      cls: 'ledger-donation',
    });

    const donateText = document.createElement('p');
    donateText.appendText(t('donate-desc'));
    div.appendChild(donateText);

    const parser = new DOMParser();

    div.appendChild(
      createDonateButton(
        'https://paypal.me/tgrosinger',
        parser.parseFromString(paypal, 'text/xml').documentElement,
      ),
    );

    div.appendChild(
      createDonateButton(
        'https://www.buymeacoffee.com/tgrosinger',
        parser.parseFromString(buyMeACoffee, 'text/xml').documentElement,
      ),
    );
  }
}

const createDonateButton = (link: string, img: HTMLElement): HTMLElement => {
  const a = document.createElement('a');
  a.setAttribute('href', link);
  a.addClass('ledger-donate-button');
  a.appendChild(img);
  return a;
};
