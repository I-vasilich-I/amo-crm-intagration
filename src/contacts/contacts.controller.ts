import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { LeadsService } from 'src/leads/leads.service';

@Controller('contacts')
export class ContactsController {
  constructor(
    private contactsService: ContactsService,
    private leadsService: LeadsService,
  ) {}

  // bit messy all in one...
  @Get()
  async getContact(
    @Query('name') name: string,
    @Query('email') email: string,
    @Query('phone') phone: string,
  ) {
    // TODO: make sure that phone and email are phone and email.
    if (!email && !phone && !name) {
      throw new BadRequestException('Provide all required fields data');
    }

    const resData: any = {};

    const foundContact = await this.contactsService.findContact({
      email,
      phone,
    });

    if (foundContact) {
      resData.found = foundContact;

      const id = foundContact._embedded.contacts[0].id;
      const updatedContact = await this.contactsService.updateContact(
        {
          email,
          phone,
          name,
        },
        id,
      );

      if (updatedContact) {
        resData.update = updatedContact;
      }

      const lead = await this.leadsService.createLead(id);
      if (lead) {
        resData.lead = lead;
      }
    }

    if (!foundContact) {
      const createdContact = await this.contactsService.createContact({
        email,
        phone,
        name,
      });

      if (createdContact) {
        resData.create = createdContact;
        const id = createdContact._embedded.contacts[0].id;
        const lead = await this.leadsService.createLead(id);

        if (lead) {
          resData.lead = lead;
        }
      }
    }

    return resData;
  }
}
